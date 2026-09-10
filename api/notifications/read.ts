import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * PATCH /api/notifications/read
 * Body: { notificationId?: string, userId: string, markAllRead?: boolean }
 * Marks one notification as read (by ID) or all for a user.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notificationId, userId, markAllRead } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let result;
    if (markAllRead) {
      result = await sql`
        UPDATE notifications
        SET read_at = NOW()
        WHERE user_id = ${userId} AND read_at IS NULL
        RETURNING id
      `;
    } else if (notificationId) {
      result = await sql`
        UPDATE notifications
        SET read_at = NOW()
        WHERE id = ${notificationId} AND user_id = ${userId} AND read_at IS NULL
        RETURNING id
      `;
    } else {
      return res.status(400).json({ error: 'Provide notificationId or markAllRead=true' });
    }

    return res.status(200).json({
      updatedCount: result.rows.length,
      markedAllRead: !!markAllRead,
    });
  } catch (error: any) {
    console.error('Mark read error:', error);
    const msg = error?.message || 'Failed to mark read';
    if (msg.includes('does not exist') || error?.code === '42P01') {
      return res.status(200).json({ updatedCount: 0 });
    }
    if (msg.toLowerCase().includes('connect')) {
      return res.status(200).json({ updatedCount: 0, simulated: true });
    }
    return res.status(500).json({ error: msg });
  }
}
