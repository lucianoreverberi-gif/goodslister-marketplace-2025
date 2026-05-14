import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { listing } = req.body;
    
    await sql`
      UPDATE listings SET 
        title = ${listing.title}, 
        description = ${listing.description}, 
        category = ${listing.category}, 
        subcategory = ${listing.subcategory}, 
        price_per_day = ${listing.pricePerDay}, 
        price_per_hour = ${listing.pricePerHour}, 
        pricing_type = ${listing.pricingType}, 
        location_city = ${listing.location.city}, 
        location_state = ${listing.location.state}, 
        location_country = ${listing.location.country}, 
        location_lat = ${listing.location.latitude}, 
        location_lng = ${listing.location.longitude}, 
        images = ${JSON.stringify(listing.images)}, 
        listing_type = ${listing.listingType}, 
        operator_license_id = ${listing.operatorLicenseId}, 
        fuel_policy = ${listing.fuelPolicy}, 
        skill_level = ${listing.skillLevel}, 
        whats_included = ${listing.whatsIncluded}, 
        itinerary = ${listing.itinerary},
        price_unit = ${listing.priceUnit}
      WHERE id = ${listing.id}
    `;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ error: 'Failed to update listing' });
  }
}
