import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { rows: boosts } = await sql`
      SELECT b.*, l.title as listing_title, l.images as listing_images
      FROM boosts b
      JOIN listings l ON b.listing_id = l.id
      WHERE b.user_id = ${user_id as string}
      ORDER BY b.created_at DESC
    `;

    const stats = await sql`
      SELECT 
        COALESCE(SUM(price_paid), 0) as total_spent,
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(inquiries_count), 0) as total_inquiries
      FROM boosts
      WHERE user_id = ${user_id as string} AND status IN ('active', 'expired')
    `;

    return res.status(200).json({ 
      boosts,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Fetch my boosts error:', error);
    return res.status(500).json({ error: 'Failed to fetch your boosts' });
  }
}
