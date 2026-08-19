import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

// Haversine distance in kilometers
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Priority scores: higher = shows first
// spotlight boost = 100 base + 200 (nationwide priority)
// regional boost = 100 base + 100 (regional priority)
// local boost = 100 base + 50 (local priority)
// featured = 30 base
// none = 0 base
function boostPriority(tier: string | null, isFeatured: boolean, expires: string | null): number {
  // Boost expired
  if (tier && expires && new Date(expires).getTime() < Date.now()) {
    return isFeatured ? 30 : 0;
  }
  if (tier === 'spotlight') return 300;
  if (tier === 'regional') return 200;
  if (tier === 'local') return 150;
  if (isFeatured) return 30;
  return 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const latStr = String(req.query.lat || '');
    const lngStr = String(req.query.lng || '');
    const radiusStr = String(req.query.radius || '50');
    const limitStr = String(req.query.limit || '20');
    const category = String(req.query.category || '').trim();

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radiusKm = parseFloat(radiusStr);
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 20, 1), 100);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid lat/lng' });
    }
    if (isNaN(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ error: 'Invalid radius' });
    }

    // Bounding box for pre-filter (rough SQL filter, then precise Haversine in JS)
    // 1 degree lat â 111 km; adjust lng by cos(lat) for actual km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // Query with optional category filter
    const { rows } = category
      ? await sql`
          SELECT * FROM listings
          WHERE status = 'active'
            AND location_lat BETWEEN ${minLat} AND ${maxLat}
            AND location_lng BETWEEN ${minLng} AND ${maxLng}
            AND category = ${category}
          LIMIT 500
        `
      : await sql`
          SELECT * FROM listings
          WHERE status = 'active'
            AND location_lat BETWEEN ${minLat} AND ${maxLat}
            AND location_lng BETWEEN ${minLng} AND ${maxLng}
          LIMIT 500
        `;

    // Precise distance filter + priority score
    const enriched = rows
      .map(r => {
        const dLat = Number(r.location_lat);
        const dLng = Number(r.location_lng);
        const distanceKm = haversineKm(lat, lng, dLat, dLng);
        const priority = boostPriority(r.boost_tier_active, !!r.is_featured, r.boost_active_until);
        return { ...r, distanceKm, priority };
      })
      .filter(r => r.distanceKm <= radiusKm);

    // Sort by (priority DESC, distance ASC)
    enriched.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.distanceKm - b.distanceKm;
    });

    // Trim to limit
    const results = enriched.slice(0, limit).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      subcategory: r.subcategory,
      pricePerDay: r.price_per_day ? Number(r.price_per_day) : null,
      priceUnit: r.price_unit || 'day',
      imageUrl: (Array.isArray(r.images) ? r.images[0] : (typeof r.images === 'string' && r.images.startsWith('[') ? JSON.parse(r.images)[0] : (typeof r.images === 'string' ? r.images.split(',')[0] : ''))),
      images: r.images,
      rating: r.average_rating ? Number(r.average_rating) : null,
      reviewsCount: r.reviews_count || 0,
      city: r.location_city,
      state: r.location_state,
      country: r.location_country,
      latitude: Number(r.location_lat),
      longitude: Number(r.location_lng),
      boostTier: r.boost_tier_active,
      isFeatured: !!r.is_featured,
      distanceKm: Math.round(r.distanceKm * 10) / 10,
      priority: r.priority,
      ownerId: r.owner_id
    }));

    return res.status(200).json({
      success: true,
      total: enriched.length,
      returned: results.length,
      radiusKm,
      center: { lat, lng },
      listings: results
    });
  } catch (error) {
    console.error('Listings nearby error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
