import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '6'), 10) || 6, 1), 20);

    // Group active listings by city+country, count them, pick a representative image
    const { rows } = await sql`
      WITH city_stats AS (
        SELECT 
          location_city AS city,
          location_state AS state,
          location_country AS country,
          COUNT(*)::int AS listings_count,
          AVG(location_lat)::float AS latitude,
          AVG(location_lng)::float AS longitude,
          MAX(CASE WHEN boost_tier_active IS NOT NULL AND (boost_active_until IS NULL OR boost_active_until > NOW()) THEN 1 ELSE 0 END)::int AS has_active_boost
        FROM listings
        WHERE status = 'active' AND location_city IS NOT NULL AND location_city != ''
        GROUP BY location_city, location_state, location_country
      ),
      representative_images AS (
        SELECT DISTINCT ON (location_city, location_country)
          location_city AS city,
          location_country AS country,
          image_url
        FROM listings
        WHERE status = 'active' AND image_url IS NOT NULL
        ORDER BY location_city, location_country, 
          CASE WHEN boost_tier_active IS NOT NULL AND (boost_active_until IS NULL OR boost_active_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      )
      SELECT s.*, ri.image_url AS representative_image
      FROM city_stats s
      LEFT JOIN representative_images ri ON ri.city = s.city AND ri.country = s.country
      ORDER BY s.has_active_boost DESC, s.listings_count DESC
      LIMIT ${limit}
    `;

    const cities = rows.map(r => ({
      city: r.city,
      state: r.state,
      country: r.country,
      listingsCount: r.listings_count,
      latitude: r.latitude,
      longitude: r.longitude,
      hasActiveBoost: r.has_active_boost === 1,
      representativeImage: r.representative_image
    }));

    return res.status(200).json({
      success: true,
      cities
    });
  } catch (error) {
    console.error('Featured cities error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
