import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Admin-only seed endpoint: 6 fake Miami owners + 20 realistic listings with
// AI-generated covers. Idempotent — skips if seed data already exists.
//
// Usage:
//   POST /api/admin/seed-miami-demo?dryRun=true  (preview)
//   POST /api/admin/seed-miami-demo              (actually seed)
//   Header: x-admin-secret: <ADMIN_MIGRATION_SECRET>
//
// Timeout: Vercel Pro 60s. We batch image generation (5 parallel) to fit.
// ---------------------------------------------------------------------------

const SEED_EMAIL_SUFFIX = '@goodslister-seed.local';

const FAKE_OWNERS = [
  { id: 'seed-owner-001', name: 'Marcos Alvarez',    email: 'marcos.alvarez'    + SEED_EMAIL_SUFFIX, avatar: 'Marcos' },
  { id: 'seed-owner-002', name: 'Isabella Fontana',  email: 'isabella.fontana'  + SEED_EMAIL_SUFFIX, avatar: 'Isabella' },
  { id: 'seed-owner-003', name: 'Tyler Brennan',     email: 'tyler.brennan'     + SEED_EMAIL_SUFFIX, avatar: 'Tyler' },
  { id: 'seed-owner-004', name: 'Priya Patel',       email: 'priya.patel'       + SEED_EMAIL_SUFFIX, avatar: 'Priya' },
  { id: 'seed-owner-005', name: 'Camila Souza',      email: 'camila.souza'      + SEED_EMAIL_SUFFIX, avatar: 'Camila' },
  { id: 'seed-owner-006', name: 'DeShawn Williams',  email: 'deshawn.williams'  + SEED_EMAIL_SUFFIX, avatar: 'DeShawn' },
];

// Miami neighborhoods with approximate coords for location variety
const MIAMI_SPOTS = [
  { city: 'Miami Beach',  lat: 25.7907, lng: -80.1300 },
  { city: 'Coconut Grove',lat: 25.7276, lng: -80.2383 },
  { city: 'Brickell',     lat: 25.7617, lng: -80.1918 },
  { city: 'Key Biscayne', lat: 25.6937, lng: -80.1626 },
  { city: 'Coral Gables', lat: 25.7215, lng: -80.2684 },
  { city: 'Wynwood',      lat: 25.8010, lng: -80.1990 },
  { city: 'Edgewater',    lat: 25.8004, lng: -80.1876 },
  { city: 'Downtown Miami', lat: 25.7742, lng: -80.1936 },
];

type SeedListing = {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  pricePerDay: number;
  itemValue: number;
  deposit: number;
  ownerIdx: number;
  spotIdx: number;
  imgPrompt: string;
};

const SEED_LISTINGS: SeedListing[] = [
  // --------- 5 KAYAKS ---------
  { title: 'Tandem Sea Kayak — Perfect for Biscayne Bay',  description: 'Stable two-person sea kayak, great for calm bay paddling. Includes 2 paddles, 2 PFDs (life jackets), and a dry bag. Launch-ready from Crandon Park or Oleta River.', category: 'Water Sports', subcategory: 'Kayak', pricePerDay: 55, itemValue: 650, deposit: 100, ownerIdx: 0, spotIdx: 3, imgPrompt: 'Professional product photo of a sleek two-person tandem sea kayak on a Miami Beach shoreline at sunrise, calm turquoise water, palm trees in background, bright natural light' },
  { title: 'Solo Fishing Kayak w/ Pedal Drive',             description: 'Hobie-style pedal drive kayak with rod holders, cooler mount, and anchor system. Perfect for fishing the Oleta River or offshore flats. Rod and tackle NOT included.', category: 'Water Sports', subcategory: 'Kayak', pricePerDay: 65, itemValue: 1200, deposit: 150, ownerIdx: 2, spotIdx: 3, imgPrompt: 'A single-person pedal-drive fishing kayak with rod holders and anchor on a mangrove channel in the Florida Keys, bright sun, clear water' },
  { title: 'Lightweight Recreational Kayak — Beginner Friendly', description: 'Perfect first kayak for calm waters. Easy to carry on a car roof. Includes paddle and PFD.', category: 'Water Sports', subcategory: 'Kayak', pricePerDay: 35, itemValue: 400, deposit: 75, ownerIdx: 4, spotIdx: 1, imgPrompt: 'A lightweight bright-colored recreational single-person kayak on a sandy Florida beach, with paddle laid across, clear sky, perfect for beginner' },
  { title: 'Sit-on-Top Kayak w/ Snorkel Mount',             description: 'Open-deck kayak ideal for snorkeling trips. Snorkel storage, mesh pocket for fins. PFD included; snorkel gear NOT.', category: 'Water Sports', subcategory: 'Kayak', pricePerDay: 45, itemValue: 550, deposit: 100, ownerIdx: 5, spotIdx: 3, imgPrompt: 'A sit-on-top kayak in bright blue on crystal-clear Florida water with a snorkel mask resting on the deck, tropical reef visible below, sunny day' },
  { title: 'Inflatable Touring Kayak — Easy Transport',     description: 'Inflates in 5 min with included pump. Fits in a trunk. Great for multi-stop trips. 2 paddles, 2 PFDs.', category: 'Water Sports', subcategory: 'Kayak', pricePerDay: 50, itemValue: 800, deposit: 100, ownerIdx: 1, spotIdx: 6, imgPrompt: 'An inflatable yellow touring kayak partially inflated on a Miami beach next to its carry bag and foot pump, late afternoon golden light' },

  // --------- 4 PADDLE BOARDS ---------
  { title: 'Premium SUP — All-Around 10\'6"',               description: 'Great entry-level stand-up paddleboard. Stable, forgiving. Includes adjustable paddle, leash, pump, and backpack.', category: 'Water Sports', subcategory: 'Paddleboard', pricePerDay: 45, itemValue: 700, deposit: 100, ownerIdx: 1, spotIdx: 0, imgPrompt: 'A pristine white all-around 10 foot 6 inch stand-up paddleboard SUP standing upright on a Miami Beach sand with calm clear ocean water behind, bright blue sky' },
  { title: 'Yoga SUP — Extra-Wide Stable Platform',         description: 'Wide 34" deck with full non-slip EVA pad. Perfect for SUP yoga sessions in Biscayne Bay.', category: 'Water Sports', subcategory: 'Paddleboard', pricePerDay: 50, itemValue: 900, deposit: 125, ownerIdx: 3, spotIdx: 1, imgPrompt: 'A wide yoga stand-up paddleboard with full-length teal EVA deck pad floating on glassy calm bay water in Coconut Grove at golden hour, serene atmosphere' },
  { title: 'Touring SUP 12\'6" — Fast and Efficient',       description: 'Displacement hull touring board for longer paddles. 2 sets of leashes. Fins included.', category: 'Water Sports', subcategory: 'Paddleboard', pricePerDay: 55, itemValue: 850, deposit: 125, ownerIdx: 5, spotIdx: 6, imgPrompt: 'A sleek 12 foot 6 inch touring stand-up paddleboard with pointed nose on open water near Miami skyline silhouette, bright day' },
  { title: 'Inflatable SUP Package — Full Kit',             description: 'iSUP that fits in a backpack. Pump, 3-piece paddle, leash, repair kit, dry bag. Great for travelers.', category: 'Water Sports', subcategory: 'Paddleboard', pricePerDay: 40, itemValue: 500, deposit: 75, ownerIdx: 0, spotIdx: 7, imgPrompt: 'An inflatable stand-up paddleboard partially rolled with pump, paddle and backpack arranged on a wooden dock, Miami skyline background' },

  // --------- 3 KITESURFING ---------
  { title: 'Kite + Bar + Pump — 10m Freeride Package',      description: '2023 freeride kite 10m, bar/lines, pump included. For intermediate+ riders. Board NOT included.', category: 'Water Sports', subcategory: 'Kitesurfing', pricePerDay: 80, itemValue: 1500, deposit: 300, ownerIdx: 2, spotIdx: 0, imgPrompt: 'A professional kitesurfing kite in bright red and white colors inflated on Crandon Park Miami beach with the control bar and pump laid out, strong wind atmosphere' },
  { title: 'Full Kiteboarding Kit — Board + 12m Kite',      description: 'Complete beginner-friendly kit. Twintip 138cm board + 12m delta kite + bar + pump + harness.', category: 'Water Sports', subcategory: 'Kitesurfing', pricePerDay: 100, itemValue: 1800, deposit: 350, ownerIdx: 4, spotIdx: 3, imgPrompt: 'A complete kiteboarding setup with a twin-tip board and inflated 12m delta kite on Key Biscayne beach, harness and bar neatly arranged, bright tropical day' },
  { title: 'Pro Wingfoil Kit — Wing + Foil + Board',        description: 'Latest wingfoil package for intermediate riders. 5m wing + hydrofoil + 85L board. Advanced only.', category: 'Water Sports', subcategory: 'Wingfoil', pricePerDay: 90, itemValue: 1700, deposit: 350, ownerIdx: 3, spotIdx: 0, imgPrompt: 'A modern wingfoil setup with inflated 5m wing and hydrofoil board on a Miami beach at sunset, equipment arranged on the sand, blue hour light' },

  // --------- 4 BIKES ---------
  { title: 'Trek Marlin 7 Mountain Bike — Size L',          description: 'Hardtail MTB, 29" wheels, 1x10 drivetrain. Perfect for Oleta River trails. Helmet included.', category: 'Bikes', subcategory: 'Mountain Bike', pricePerDay: 45, itemValue: 1100, deposit: 200, ownerIdx: 5, spotIdx: 3, imgPrompt: 'A black and red Trek Marlin 7 hardtail mountain bike leaning against a tree on a sandy trail at Oleta River State Park Florida, dappled sunlight through pine trees' },
  { title: 'Specialized Allez Road Bike — Size M',          description: 'Lightweight aluminum road bike for Rickenbacker Causeway rides. Includes helmet, pump, spare tube.', category: 'Bikes', subcategory: 'Road Bike', pricePerDay: 55, itemValue: 1800, deposit: 300, ownerIdx: 0, spotIdx: 2, imgPrompt: 'A sleek white and red Specialized Allez aluminum road bicycle on the Rickenbacker Causeway bridge with Miami skyline in distance, morning light, racing posture' },
  { title: 'Beach Cruiser — Pedal Through Miami Beach',     description: 'Classic 7-speed cruiser with wide handlebars and comfy seat. Basket + bell + helmet included.', category: 'Bikes', subcategory: 'Cruiser', pricePerDay: 25, itemValue: 450, deposit: 75, ownerIdx: 1, spotIdx: 0, imgPrompt: 'A classic turquoise beach cruiser bicycle with wicker basket and brown leather seat parked at a Miami Beach boardwalk, pastel art-deco buildings in soft focus behind, bright sunny day' },
  { title: 'Cannondale Topstone Gravel Bike — Size L',      description: 'All-road gravel bike for Shark Valley or the Everglades Loop. Carbon fork, GRX 2x. Helmet included.', category: 'Bikes', subcategory: 'Gravel Bike', pricePerDay: 70, itemValue: 2400, deposit: 400, ownerIdx: 2, spotIdx: 4, imgPrompt: 'A matte grey Cannondale Topstone gravel bicycle on a crushed-limestone trail through sawgrass prairie in Shark Valley Everglades, bright midday sun, no people' },

  // --------- 4 E-MOTOS / ELECTRIC RIDEABLES ---------
  { title: 'Super73-RX Electric Bike — Moped Style',        description: 'Fat-tire electric moto-bike, 20 mph pedal-assist, 40+ mile range. Helmet included. Pickup Wynwood.', category: 'Electric Rideables', subcategory: 'E-Bike', pricePerDay: 75, itemValue: 2800, deposit: 500, ownerIdx: 3, spotIdx: 5, imgPrompt: 'A matte black Super73-RX moped-style electric bike with fat tires parked on a colorful Wynwood Miami graffiti-wall street, late afternoon golden light' },
  { title: 'NIU KQi3 Pro Electric Scooter — Long Range',    description: 'Premium kickscooter, 30 mi range, 20 mph top. Perfect for Brickell commute or boardwalk.', category: 'Electric Rideables', subcategory: 'E-Scooter', pricePerDay: 45, itemValue: 900, deposit: 200, ownerIdx: 4, spotIdx: 2, imgPrompt: 'A clean white and grey NIU KQi3 Pro electric kick scooter standing in Brickell Miami urban setting with glass skyscrapers behind, bright morning light' },
  { title: 'Onewheel GT — High Performance',                description: 'Latest Onewheel GT, up to 32 mi range, 20 mph. For experienced riders only. Helmet and pads included.', category: 'Electric Rideables', subcategory: 'Onewheel', pricePerDay: 95, itemValue: 3200, deposit: 600, ownerIdx: 5, spotIdx: 0, imgPrompt: 'A Onewheel GT electric board with black deck on a Miami beach boardwalk at sunset, perfect balance, dynamic angle, premium look' },
  { title: 'Vespa-Style Electric Moped — No License Needed','description': 'Street-legal under 30mph electric moped, 50 mi range. 2 helmets included. Must be 18+.', category: 'Electric Rideables', subcategory: 'E-Moped', pricePerDay: 120, itemValue: 3800, deposit: 700, ownerIdx: 1, spotIdx: 1, imgPrompt: 'A mint green Vespa-style electric moped parked on a leafy Coconut Grove Miami residential street, two helmets on the seat, warm golden sunlight filtering through palm trees' },
];

async function generateImage(ai: GoogleGenAI, prompt: string): Promise<Buffer | null> {
  // Uses the SAME SDK pattern as /api/generate-image for consistency.
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '16:9' } },
    });
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }
    return null;
  } catch (err: any) {
    console.error('[seed] Image generation failed:', err?.message || err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ---------- Auth ----------
  const expectedSecret = process.env.ADMIN_MIGRATION_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ error: 'ADMIN_MIGRATION_SECRET not configured' });
  }
  const clientSecret = req.headers['x-admin-secret'];
  if (typeof clientSecret !== 'string') {
    return res.status(401).json({ error: "Missing 'x-admin-secret' header" });
  }
  const expectedHash = crypto.createHash('sha256').update(expectedSecret).digest();
  const clientHash = crypto.createHash('sha256').update(clientSecret).digest();
  if (expectedHash.length !== clientHash.length || !crypto.timingSafeEqual(expectedHash, clientHash)) {
    return res.status(401).json({ error: 'Invalid admin secret' });
  }

  const dryRun = String(req.query.dryRun || '').toLowerCase() === 'true';
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY (Gemini) not configured' });
  }

  // ---------- Idempotency ----------
  const existing = await sql`
    SELECT COUNT(*)::int AS cnt FROM users WHERE email LIKE ${'%' + SEED_EMAIL_SUFFIX}
  `;
  const existingCount = existing.rows[0]?.cnt || 0;
  if (existingCount > 0) {
    return res.status(200).json({
      skipped: true,
      reason: 'Seed data already exists',
      existing_seed_users: existingCount,
      hint: 'To re-seed, delete rows where email LIKE %@goodslister-seed.local first'
    });
  }

  if (dryRun) {
    return res.status(200).json({
      dryRun: true,
      would_create_users: FAKE_OWNERS.length,
      would_create_listings: SEED_LISTINGS.length,
      categories: Array.from(new Set(SEED_LISTINGS.map(l => l.category + '/' + l.subcategory))),
      locations: Array.from(new Set(SEED_LISTINGS.map(l => MIAMI_SPOTS[l.spotIdx].city))),
    });
  }

  // ---------- 1. Create 6 fake users ----------
  for (const u of FAKE_OWNERS) {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.avatar)}&backgroundColor=b6e3f4`;
    await sql`
      INSERT INTO users (
        id, name, email, registered_date, avatar_url,
        is_email_verified, is_phone_verified, is_id_verified,
        average_rating, total_reviews, favorites
      ) VALUES (
        ${u.id}, ${u.name}, ${u.email}, NOW(), ${avatarUrl},
        true, true, true,
        ${4.5 + Math.random() * 0.5}, ${Math.floor(Math.random() * 25) + 5}, ${'[]'}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // ---------- 2. Generate 20 images in batches of 5 ----------
  const ai = new GoogleGenAI({ apiKey });
  const imageBuffers: (Buffer | null)[] = new Array(SEED_LISTINGS.length).fill(null);
  const BATCH_SIZE = 5;
  for (let i = 0; i < SEED_LISTINGS.length; i += BATCH_SIZE) {
    const batch = SEED_LISTINGS.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(l => generateImage(ai, l.imgPrompt)));
    results.forEach((buf, j) => { imageBuffers[i + j] = buf; });
  }

  // ---------- 3. Upload each image to Vercel Blob ----------
  const imageUrls: (string | null)[] = await Promise.all(
    imageBuffers.map(async (buf, i) => {
      if (!buf) return null;
      try {
        const blob = await put(`seed/listing-${i + 1}-${Date.now()}.png`, buf, {
          access: 'public',
          contentType: 'image/png',
        });
        return blob.url;
      } catch (err) {
        console.error(`[seed] Blob upload failed for listing ${i}:`, err);
        return null;
      }
    })
  );

  // ---------- 4. Insert 20 listings ----------
  const createdListings: Array<{ id: string; title: string; imageOk: boolean }> = [];
  for (let i = 0; i < SEED_LISTINGS.length; i++) {
    const l = SEED_LISTINGS[i];
    const owner = FAKE_OWNERS[l.ownerIdx];
    const spot = MIAMI_SPOTS[l.spotIdx];
    const imgUrl = imageUrls[i];
    const listingId = `seed-listing-${String(i + 1).padStart(3, '0')}-${Date.now().toString(36)}`;
    // Jitter location by ~500m for realism
    const latJitter = (Math.random() - 0.5) * 0.008;
    const lngJitter = (Math.random() - 0.5) * 0.008;

    try {
      await sql`
        INSERT INTO listings (
          id, title, description, category, subcategory,
          price_per_day, pricing_type,
          location_city, location_state, location_country, location_lat, location_lng,
          owner_id, images,
          rating, reviews_count, item_value, deposit_amount,
          moderation_status
        ) VALUES (
          ${listingId}, ${l.title}, ${l.description}, ${l.category}, ${l.subcategory},
          ${l.pricePerDay}, 'daily',
          ${spot.city}, 'FL', 'USA', ${spot.lat + latJitter}, ${spot.lng + lngJitter},
          ${owner.id}, ${imgUrl ? [imgUrl] : []}::text[],
          ${4.6 + Math.random() * 0.4}, ${Math.floor(Math.random() * 20) + 3},
          ${l.itemValue}, ${l.deposit},
          'approved'
        )
      `;
      createdListings.push({ id: listingId, title: l.title, imageOk: !!imgUrl });
    } catch (err: any) {
      console.error(`[seed] Insert listing ${i} failed:`, err?.message);
      createdListings.push({ id: listingId, title: l.title + ' (FAILED: ' + err?.message + ')', imageOk: false });
    }
  }

  return res.status(200).json({
    success: true,
    users_created: FAKE_OWNERS.length,
    listings_created: createdListings.length,
    images_generated: imageUrls.filter(Boolean).length,
    images_failed: imageUrls.filter(x => !x).length,
    listings: createdListings,
  });
}
