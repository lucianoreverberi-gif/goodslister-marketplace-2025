import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// One-time migration to create the boosts table + boost_waitlist
// Call GET /api/admin/init-boosts?secret=SETUP_TOKEN
// Idempotent - safe to run multiple times

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.secret;
  const expected = process.env.SETUP_TOKEN || 'goodslister-setup-2026';
  if (token !== expected) {
    return res.status(401).json({ error: 'Unauthorized. Pass ?secret=<SETUP_TOKEN>' });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS boosts (
        id SERIAL PRIMARY KEY,
        listing_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        tier VARCHAR(20) NOT NULL,
        price_paid NUMERIC(10,2) NOT NULL,
        stripe_checkout_session_id TEXT UNIQUE,
        stripe_payment_intent_id TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        activated_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        views_count INTEGER NOT NULL DEFAULT 0,
        inquiries_count INTEGER NOT NULL DEFAULT 0
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_boosts_listing_status ON boosts(listing_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_boosts_session ON boosts(stripe_checkout_session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_boosts_user ON boosts(user_id)`;
    await sql`
      CREATE TABLE IF NOT EXISTS boost_waitlist (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        listing_id TEXT,
        desired_tier VARCHAR(20),
        user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const { rows } = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'boosts' ORDER BY ordinal_position
    `;

    return res.status(200).json({
      status: 'ok',
      message: 'Boosts schema initialized',
      boostsColumns: rows
    });
  } catch (e: any) {
    console.error('init-boosts error:', e);
    return res.status(500).json({ error: e.message });
  }
}

