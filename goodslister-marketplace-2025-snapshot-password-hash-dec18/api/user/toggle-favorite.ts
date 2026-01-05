
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, listingId } = req.body;

  if (!userId || !listingId) {
      return res.status(400).json({ error: 'Missing userId or listingId' });
  }

  try {
    // Check if listing is already in favorites
    const userResult = await sql`SELECT favorites FROM users WHERE id = ${userId}`;
    
    if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    const currentFavorites: string[] = userResult.rows[0].favorites || [];
    let newFavorites: string[];

    if (currentFavorites.includes(listingId)) {
        // Remove
        newFavorites = currentFavorites.filter(id => id !== listingId);
    } else {
        // Add
        newFavorites = [...currentFavorites, listingId];
    }

    await sql`UPDATE users SET favorites = ${newFavorites as any} WHERE id = ${userId}`;

    return res.status(200).json({ success: true, favorites: newFavorites });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ error: 'Failed to update favorites' });
  }
}
