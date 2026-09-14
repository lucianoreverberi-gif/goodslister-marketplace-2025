import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

/**
 * GET /api/auth/google-calendar/callback?code=...&state=...
 *
 * OAuth 2.0 callback endpoint. Google redirects here after the user grants
 * (or denies) permission on the consent screen.
 *
 * On success:
 *   1. Validates the state nonce (matches a userId we recorded in init.ts)
 *   2. Exchanges the authorization code for access_token + refresh_token
 *   3. Fetches the user's primary Google Calendar id + email
 *   4. Saves everything on the users row and marks google_sync_enabled = true
 *   5. Deletes the used nonce
 *   6. Redirects back to the dashboard with a success flag
 *
 * On error (user denied, missing code, expired nonce, token exchange failed):
 *   Redirects to the dashboard with an error flag so the UI can show a toast.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

    const dashboardUrl = 'https://www.goodslister.com/#userDashboard';
    const errorRedirect = (reason: string) =>
        res.redirect(302, `${dashboardUrl}?googleCalendar=error&reason=${encodeURIComponent(reason)}`);

    // User declined consent — Google returns error=access_denied
    if (req.query.error) {
        return errorRedirect(String(req.query.error));
    }

    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    if (!code || !state) {
        return errorRedirect('missing_code_or_state');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        return errorRedirect('server_misconfigured');
    }

    try {
        // 1. Validate the state nonce and look up the userId
        const nonceRow = await sql`
            SELECT user_id
            FROM google_oauth_nonces
            WHERE nonce = ${state}
              AND created_at > NOW() - INTERVAL '10 minutes'
            LIMIT 1
        `;
        if (nonceRow.rows.length === 0) {
            return errorRedirect('invalid_or_expired_state');
        }
        const userId: string = nonceRow.rows[0].user_id;

        // 2. Exchange the code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }).toString(),
        });
        if (!tokenRes.ok) {
            const body = await tokenRes.text();
            console.error('[google-calendar/callback] token exchange failed:', tokenRes.status, body);
            return errorRedirect('token_exchange_failed');
        }
        const tokens = await tokenRes.json();
        const accessToken: string = tokens.access_token;
        const refreshToken: string | undefined = tokens.refresh_token;
        const expiresInSec: number = Number(tokens.expires_in) || 3600;
        const expiresAt = new Date(Date.now() + expiresInSec * 1000);

        if (!accessToken || !refreshToken) {
            // refresh_token is only returned when the user has not previously
            // consented — our init.ts sets prompt=consent to force this, so if
            // it's missing something else went wrong.
            console.error('[google-calendar/callback] missing tokens:', Object.keys(tokens));
            return errorRedirect('missing_refresh_token');
        }

        // 3. Get the user's Google email + primary calendar id
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userinfo = userinfoRes.ok ? await userinfoRes.json() : {};
        const googleEmail: string | undefined = userinfo.email;

        const calListRes = await fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const calList = calListRes.ok ? await calListRes.json() : {};
        const primaryCalendarId: string = calList.id || googleEmail || 'primary';

        // 4. Save on the users row and mark sync enabled
        await sql`
            UPDATE users
            SET
                google_email = ${googleEmail || null},
                google_calendar_id = ${primaryCalendarId},
                google_refresh_token = ${refreshToken},
                google_access_token = ${accessToken},
                google_token_expires_at = ${expiresAt.toISOString()},
                google_sync_enabled = true,
                google_last_sync_at = NULL
            WHERE id = ${userId}
        `;

        // 5. Delete the used nonce
        await sql`DELETE FROM google_oauth_nonces WHERE nonce = ${state}`;

        // 6. Redirect back with a success flag; the UI reads ?googleCalendar=connected
        return res.redirect(302, `${dashboardUrl}?googleCalendar=connected`);
    } catch (err: any) {
        console.error('[google-calendar/callback] error:', err);
        return errorRedirect('server_error');
    }
}
