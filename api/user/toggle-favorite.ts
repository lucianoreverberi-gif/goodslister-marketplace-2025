import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, listingId } = req.body;
    
    const userQuery = await sql`SELECT favorites FROM users WHERE id = ${userId}`;
    if (userQuery.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    let favorites = userQuery.rows[0].favorites || [];
    if (typeof favorites === 'string') favorites = JSON.parse(favorites);

    if (favorites.includes(listingId)) {
      favorites = favorites.filter((id: string) => id !== listingId);
    } else {
      favorites.push(listingId);
    }

    await sql`UPDATE users SET favorites = ${JSON.stringify(favorites)} WHERE id = ${userId}`;
    
    return res.status(200).json({ success: true, favorites });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}
