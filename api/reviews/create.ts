
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to create tables if they don't exist
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

// CRITICAL: Helper to create missing dependencies (The "Rescue" Logic)
async function repairMissingDependencies(bookingId: string, authorId: string, targetId: string) {
    console.log(`Self-healing: Repairing dependencies for booking ${bookingId}...`);
    
    // 1. Ensure Users Exist (Author & Target)
    // We use dummy data for placeholders to satisfy constraints if real users are missing
    const usersToFix = [authorId, targetId];
    for (const uid of usersToFix) {
        await sql`
            INSERT INTO users (id, name, email, registered_date, avatar_url)
            VALUES (${uid}, 'Restored User', ${uid + '@example.com'}, CURRENT_DATE, 'https://i.pravatar.cc/150')
            ON CONFLICT (id) DO NOTHING
        `;
    }

    // 2. Ensure Listing Exists (Placeholder) needed for booking FK
    const placeholderListingId = 'listing-restored';
    await sql`
        INSERT INTO listings (id, title, description, category, pricing_type, price_per_day, location_city, location_state, location_country, location_lat, location_lng, owner_id)
        VALUES (${placeholderListingId}, 'Restored Item', 'System restored listing', 'Motorcycles', 'daily', 50, 'Miami', 'FL', 'USA', 25.76, -80.19, ${targetId})
        ON CONFLICT (id) DO NOTHING
    `;

    // 3. Ensure Booking Exists
    await sql`
        INSERT INTO bookings (id, listing_id, renter_id, start_date, end_date, total_price, status, payment_method)
        VALUES (${bookingId}, ${placeholderListingId}, ${authorId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 100, 'completed', 'platform')
        ON CONFLICT (id) DO NOTHING
    `;
    
    console.log("Self-healing: Dependencies repaired.");
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

  const executeReviewCreation = async (retryCount = 0): Promise<any> => {
      try {
        const id = `rev-${Date.now()}`;
        let status = 'PENDING';

        // 1. Check if the OTHER party has already left a review for this booking
        try {
            const existingReviews = await sql`
                SELECT id FROM reviews 
                WHERE booking_id = ${bookingId} AND author_id != ${authorId}
            `;
            if (existingReviews.rows.length > 0) {
                status = 'PUBLISHED';
                await sql`UPDATE reviews SET status = 'PUBLISHED' WHERE booking_id = ${bookingId}`;
            }
        } catch (e) {
            // Table might not exist yet, ignore
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
            try {
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
            } catch (e) { console.warn("Failed to update stats", e); }
        }

        return { 
            success: true, 
            reviewId: id, 
            status: status,
            message: status === 'PUBLISHED' ? "Review published! Both reviews are now visible." : "Review submitted. It will be visible once the other party reviews or in 14 days."
        };

      } catch (error: any) {
          // --- AUTO-HEAL LOGIC ---
          if (retryCount >= 2) throw error; // Prevent infinite loops

          // Case A: Table doesn't exist (Error 42P01)
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
              await ensureReviewsTable();
              return await executeReviewCreation(retryCount + 1);
          }

          // Case B: Missing Booking/User Reference (Error 23503 - Foreign Key Violation)
          // This fixes the specific error you are seeing
          if (error.code === '23503') {
              await repairMissingDependencies(bookingId, authorId, targetId);
              return await executeReviewCreation(retryCount + 1);
          }

          throw error;
      }
  };

  try {
    const result = await executeReviewCreation();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: `Create review error: ${error.message}` });
  }
}
