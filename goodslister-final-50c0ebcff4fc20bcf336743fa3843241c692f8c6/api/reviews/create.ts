
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
      bookingId, 
      authorId, 
      targetId, 
      role, 
      rating, 
      comment, 
      privateNote,
      // Metrics
      careRating,
      cleanRating,
      accuracyRating,
      safetyRating
  } = req.body;

  if (!bookingId || !authorId || !rating) {
      return res.status(400).json({ error: 'Missing required review fields' });
  }

  try {
    const id = `rev-${Date.now()}`;
    let status = 'PENDING';

    // 1. Check if the OTHER party has already left a review
    const existingReviews = await sql`
        SELECT id FROM reviews 
        WHERE booking_id = ${bookingId} AND author_id != ${authorId}
    `;

    if (existingReviews.rows.length > 0) {
        status = 'PUBLISHED';
        // Unlock existing
        await sql`UPDATE reviews SET status = 'PUBLISHED' WHERE booking_id = ${bookingId}`;
    }

    // 2. Insert new review
    await sql`
        INSERT INTO reviews (
            id, booking_id, author_id, target_id, role, rating, comment, private_note,
            care_rating, clean_rating, accuracy_rating, safety_rating,
            status
        )
        VALUES (
            ${id}, ${bookingId}, ${authorId}, ${targetId}, ${role}, ${rating}, ${comment}, ${privateNote || ''},
            ${careRating || null}, ${cleanRating || null}, ${accuracyRating || null}, ${safetyRating || null},
            ${status}
        )
    `;

    // 3. Update Aggregate Rating
    if (status === 'PUBLISHED') {
        const stats = await sql`
            SELECT AVG(rating) as avg_rating, COUNT(*) as count 
            FROM reviews 
            WHERE target_id = ${targetId} AND status = 'PUBLISHED'
        `;
        if (stats.rows.length > 0) {
            const newAvg = parseFloat(stats.rows[0].avg_rating).toFixed(2);
            const newCount = stats.rows[0].count;
            await sql`UPDATE users SET average_rating = ${newAvg}, total_reviews = ${newCount} WHERE id = ${targetId}`;
        }
    }

    return res.status(200).json({ success: true, reviewId: id, status: status });

  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
}
