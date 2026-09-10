import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/notifications/list?userId=X&limit=20&unreadOnly=false
 * Returns notifications for a user, most recent first.
 * Also returns unread count for badge display.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, limit = '20', unreadOnly } = req.query;
    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 100);
    const showUnreadOnly = String(unreadOnly) === 'true';

    // Get unread count (for badge)
    const countResult = await sql`
      SELECT COUNT(*)::int AS unread_count FROM notifications
      WHERE user_id = ${userId} AND read_at IS NULL
    `;
    const unreadCount = countResult.rows[0]?.unread_count || 0;

    // Get notifications list
    const listResult = showUnreadOnly
      ? await sql`SELECT * FROM notifications WHERE user_id = ${userId} AND read_at IS NULL ORDER BY created_at DESC LIMIT ${limitNum}`
      : await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limitNum}`;

    return res.status(200).json({
      notifications: listResult.rows,
      unreadCount,
    });
  } catch (error: any) {
    console.error('List notifications error:', error);
    const msg = error?.message || 'Failed to list notifications';
    if (msg.includes('does not exist') || error?.code === '42P01') {
      return res.status(200).json({ notifications: [], unreadCount: 0 });
    }
    if (msg.toLowerCase().includes('connect')) {
      return res.status(200).json({ notifications: [], unreadCount: 0, simulated: true });
    }
    return res.status(500).json({ error: msg });
  }
}
