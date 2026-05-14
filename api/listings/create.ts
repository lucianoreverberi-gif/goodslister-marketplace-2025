import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { listing } = req.body;
    
    await sql`
      INSERT INTO listings (
        id, title, description, category, subcategory, price_per_day, price_per_hour, 
        pricing_type, location_city, location_state, location_country, location_lat, 
        location_lng, owner_id, images, is_featured, rating, reviews_count, booked_dates,
        listing_type, operator_license_id, fuel_policy, skill_level, whats_included, itinerary,
        price_unit
      ) VALUES (
        ${listing.id}, ${listing.title}, ${listing.description}, ${listing.category}, 
        ${listing.subcategory}, ${listing.pricePerDay}, ${listing.pricePerHour}, 
        ${listing.pricingType}, ${listing.location.city}, ${listing.location.state}, 
        ${listing.location.country}, ${listing.location.latitude}, ${listing.location.longitude}, 
        ${listing.owner.id}, ${JSON.stringify(listing.images)}, ${listing.isFeatured}, 
        ${listing.rating}, ${listing.reviewsCount}, ${JSON.stringify(listing.bookedDates)},
        ${listing.listingType}, ${listing.operatorLicenseId}, ${listing.fuelPolicy},
        ${listing.skillLevel}, ${listing.whatsIncluded}, ${listing.itinerary},
        ${listing.priceUnit}
      )
    `;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ error: 'Failed to create listing' });
  }
}
