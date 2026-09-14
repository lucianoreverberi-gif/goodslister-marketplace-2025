import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

/**
 * POST /api/auth/google-calendar/disconnect
 * Body: { userId: string }
 *
 * Disconnects Google Calendar for a user:
 *   1. Best-effort revoke of the refresh_token at Google
 *   2. Clears all google_* columns on the users row
 *   3. Marks google_sync_enabled = false
 *
 * The response is JSON so the frontend can show a toast.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = String(req.body?.userId || '').trim();
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        // 1. Load current tokens (best-effort revoke)
        const row = await sql`
            SELECT google_refresh_token, google_access_token
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;
        if (row.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const refresh = row.rows[0].google_refresh_token as string | null;
        const access = row.rows[0].google_access_token as string | null;

        // Revoke the refresh token (this also invalidates the access token)
        // If it fails we still clear locally — the user can revoke manually
        // from Google Account settings.
        const tokenToRevoke = refresh || access;
        if (tokenToRevoke) {
            try {
                await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(tokenToRevoke), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
            } catch (revokeErr) {
                console.warn('[google-calendar/disconnect] revoke failed (continuing):', revokeErr);
            }
        }

        // 2. Clear all google_* columns
        await sql`
            UPDATE users
            SET
                google_email = NULL,
                google_calendar_id = NULL,
                google_refresh_token = NULL,
                google_access_token = NULL,
                google_token_expires_at = NULL,
                google_sync_enabled = false,
                google_last_sync_at = NULL,
                google_channel_id = NULL,
                google_channel_expires_at = NULL
            WHERE id = ${userId}
        `;

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('[google-calendar/disconnect] error:', err);
        return res.status(500).json({ error: err?.message || 'Server error' });
    }
}
