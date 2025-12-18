
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { listing } = req.body;

  if (!listing || !listing.owner || !listing.owner.id) {
      return res.status(400).json({ error: 'Invalid listing data' });
  }

  try {
    await sql`
        INSERT INTO listings (
            id, title, description, category, subcategory, 
            price_per_day, price_per_hour, pricing_type, 
            location_city, location_state, location_country, location_lat, location_lng,
            owner_id, images, video_url, is_featured, rating, reviews_count, booked_dates, owner_rules,
            has_gps_tracker, has_commercial_insurance, security_deposit,
            listing_type, operator_license_id, fuel_policy, skill_level, whats_included, itinerary, price_unit
        )
        VALUES (
            ${listing.id}, ${listing.title}, ${listing.description}, ${listing.category}, ${listing.subcategory},
            ${listing.pricePerDay || 0}, ${listing.pricePerHour || 0}, ${listing.pricingType},
            ${listing.location.city}, ${listing.location.state}, ${listing.location.country}, ${listing.location.latitude}, ${listing.location.longitude},
            ${listing.owner.id}, ${listing.images as any}, ${listing.videoUrl || ''}, ${listing.isFeatured}, ${listing.rating}, ${listing.reviewsCount}, ${listing.bookedDates as any}, ${listing.ownerRules || ''},
            ${listing.hasGpsTracker || false}, ${listing.hasCommercialInsurance || false}, ${listing.securityDeposit || 0},
            ${listing.listingType || 'rental'}, ${listing.operatorLicenseId || ''}, ${listing.fuelPolicy || ''}, ${listing.skillLevel || ''}, ${listing.whatsIncluded || ''}, ${listing.itinerary || ''}, ${listing.priceUnit || 'item'}
        )
    `;

    return res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ error: 'Failed to create listing' });
  }
}
