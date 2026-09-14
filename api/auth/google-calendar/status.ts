import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

/**
 * GET /api/auth/google-calendar/status?userId=<uuid>
 *
 * Returns the Google Calendar connection status for a user so the
 * frontend widget can render the correct UI without needing to change
 * the shared User type.
 *
 * Response shape:
 *   { connected: false }                         // not connected
 *   { connected: true, email, lastSync }         // connected
 *   { connected: false, error }                  // server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = String(req.query.userId || '').trim();
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        // Ensure the sync columns exist (idempotent). Copy-pasted here so
        // /status can be called even before /init has run for this user.
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

        const row = await sql`
            SELECT
                google_sync_enabled,
                google_email,
                google_last_sync_at,
                google_calendar_id
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;

        if (row.rows.length === 0) {
            return res.status(200).json({ connected: false });
        }

        const r = row.rows[0];
        // Consider a user "connected" when sync is enabled AND we still have
        // the calendar id (protects against half-cleared rows).
        const connected = !!r.google_sync_enabled && !!r.google_calendar_id;

        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({
            connected,
            email: connected ? r.google_email : null,
            lastSync: connected ? r.google_last_sync_at : null,
            calendarId: connected ? r.google_calendar_id : null,
        });
    } catch (err: any) {
        console.error('[google-calendar/status] error:', err);
        return res.status(500).json({ connected: false, error: err?.message || 'Server error' });
    }
}
