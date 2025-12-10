
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function ensureReviewsTable() {
    console.log("Self-healing: Creating missing reviews table...");
    await sql`
        CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR(255) PRIMARY KEY,
            booking_id VARCHAR(255) REFERENCES bookings(id),
            author_id VARCHAR(255) REFERENCES users(id),
            target_id VARCHAR(255) REFERENCES users(id),
            role VARCHAR(20),
            rating NUMERIC(3, 2),
            comment TEXT,
            private_note TEXT,
            care_rating NUMERIC(3, 2),
            clean_rating NUMERIC(3, 2),
            accuracy_rating NUMERIC(3, 2),
            safety_rating NUMERIC(3, 2),
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    console.log("Self-healing: Reviews table created.");
}

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

  const executeReviewCreation = async (retry = true): Promise<any> => {
      try {
        const id = `rev-${Date.now()}`;
        let status = 'PENDING';

        // 1. Check if the OTHER party has already left a review for this booking
        // If yes, we "unlock" (PUBLISH) both reviews immediately.
        const existingReviews = await sql`
            SELECT id FROM reviews 
            WHERE booking_id = ${bookingId} AND author_id != ${authorId}
        `;

        if (existingReviews.rows.length > 0) {
            status = 'PUBLISHED';
            // Unlock the existing review(s) as well
            await sql`
                UPDATE reviews 
                SET status = 'PUBLISHED' 
                WHERE booking_id = ${bookingId}
            `;
        }

        // 2. Insert the new review
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

        // 3. If published, update the target user's aggregate rating
        if (status === 'PUBLISHED') {
            // Recalculate average for the target user
            const stats = await sql`
                SELECT AVG(rating) as avg_rating, COUNT(*) as count 
                FROM reviews 
                WHERE target_id = ${targetId} AND status = 'PUBLISHED'
            `;
            
            if (stats.rows.length > 0) {
                const newAvg = parseFloat(stats.rows[0].avg_rating).toFixed(2);
                const newCount = stats.rows[0].count;
                await sql`
                    UPDATE users 
                    SET average_rating = ${newAvg}, total_reviews = ${newCount} 
                    WHERE id = ${targetId}
                `;
            }
        }

        return { 
            success: true, 
            reviewId: id, 
            status: status,
            message: status === 'PUBLISHED' ? "Review published! Both reviews are now visible." : "Review submitted. It will be visible once the other party reviews or in 14 days."
        };

      } catch (error: any) {
          // AUTO-HEAL: If table doesn't exist, create it and retry
          if (retry && (error.code === '42P01' || error.message?.includes('does not exist'))) {
              await ensureReviewsTable();
              return await executeReviewCreation(false); // Retry once
          }
          throw error;
      }
  };

  try {
    const result = await executeReviewCreation();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: `Failed to submit review: ${error.message || 'Unknown DB error'}` });
  }
}
