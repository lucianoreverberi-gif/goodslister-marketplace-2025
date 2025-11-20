
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { listing } = req.body;

  if (!listing || !listing.id) {
      return res.status(400).json({ error: 'Invalid listing data' });
  }

  try {
    // Use arrays for images and booked_dates to match Postgres schema
    await sql`
        UPDATE listings SET
            title = ${listing.title},
            description = ${listing.description},
            category = ${listing.category},
            subcategory = ${listing.subcategory},
            price_per_day = ${listing.pricePerDay || 0},
            price_per_hour = ${listing.pricePerHour || 0},
            pricing_type = ${listing.pricingType},
            location_city = ${listing.location.city},
            location_state = ${listing.location.state},
            location_country = ${listing.location.country},
            location_lat = ${listing.location.latitude},
            location_lng = ${listing.location.longitude},
            images = ${listing.images as any},
            video_url = ${listing.videoUrl || ''},
            owner_rules = ${listing.ownerRules || ''}
        WHERE id = ${listing.id}
    `;

    return res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ error: 'Failed to update listing' });
  }
}
