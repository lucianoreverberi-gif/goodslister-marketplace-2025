import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

/**
 * GET /api/auth/google-calendar/init?userId=<uuid>
 *
 * Starts the Google Calendar OAuth 2.0 flow:
 *   1. Ensures the users table has the sync columns
 *   2. Generates a state token (userId + random nonce) for CSRF protection
 *   3. Redirects the browser to Google's consent screen
 *
 * The user grants access and Google redirects back to
 * /api/auth/google-calendar/callback with an authorization code.
 *
 * Scopes requested:
 *   - calendar.events   (create / update / delete Goodslister events)
 *   - calendar.readonly (pull external blocks to prevent double-booking)
 *   - openid + email    (to link the Google account for troubleshooting)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

    const userId = String(req.query.userId || '').trim();
    if (!userId) {
        return res.status(400).send('Missing userId');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
        return res
            .status(500)
            .send('Server misconfigured: GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not set');
    }

    try {
        // Idempotent: add sync columns if not present
        await sql`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS google_email TEXT,
            ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
            ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
            ADD COLUMN IF NOT EXISTS google_access_token TEXT,
            ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS google_sync_enabled BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS google_last_sync_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS google_channel_id TEXT,
            ADD COLUMN IF NOT EXISTS google_channel_expires_at TIMESTAMPTZ
        `;

        // Ensure connection nonces table exists (short-lived CSRF tokens)
        await sql`
            CREATE TABLE IF NOT EXISTS google_oauth_nonces (
                nonce TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `;

        // Generate a random nonce and store it with the userId
        const nonce = generateNonce();
        await sql`
            INSERT INTO google_oauth_nonces (nonce, user_id)
            VALUES (${nonce}, ${userId})
            ON CONFLICT (nonce) DO NOTHING
        `;

        // Clean up nonces older than 10 minutes (best-effort)
        await sql`
            DELETE FROM google_oauth_nonces
            WHERE created_at < NOW() - INTERVAL '10 minutes'
        `;

        const scopes = [
            'openid',
            'email',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.readonly',
        ].join(' ');

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('access_type', 'offline'); // required for refresh_token
        authUrl.searchParams.set('prompt', 'consent'); // force re-consent so we always get a refresh_token
        authUrl.searchParams.set('state', nonce);
        authUrl.searchParams.set('include_granted_scopes', 'true');

        res.setHeader('Cache-Control', 'no-store');
        return res.redirect(302, authUrl.toString());
    } catch (err: any) {
        console.error('[google-calendar/init] error:', err);
        return res.status(500).send('Failed to start OAuth flow: ' + (err?.message || 'unknown'));
    }
}

/**
 * Cryptographically strong random nonce (base64url, ~32 chars).
 * Uses Web Crypto for compatibility across Node & Edge runtimes.
 */
function generateNonce(): string {
    const bytes = new Uint8Array(24);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto.getRandomValues(bytes);
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
