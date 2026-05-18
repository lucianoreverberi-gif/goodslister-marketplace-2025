-- Migration: 002_boosts.sql
-- Description: Infrastructure for Boost Exposure feature

-- Table boosts
CREATE TABLE IF NOT EXISTS boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('local','spotlight','regional')),
    price_paid NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','refunded','failed')),
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    views_count INT NOT NULL DEFAULT 0,
    inquiries_count INT NOT NULL DEFAULT 0,
    bookings_count INT NOT NULL DEFAULT 0
);

-- Indexes for boosts
CREATE INDEX IF NOT EXISTS idx_boosts_listing_status ON boosts(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_boosts_user_status ON boosts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_boosts_expires_at_active ON boosts(expires_at) WHERE status='active';

-- Cached columns added to listings for fast ranking queries
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boost_active_until TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boost_tier_active TEXT CHECK (boost_tier_active IN ('local','spotlight','regional'));
CREATE INDEX IF NOT EXISTS idx_listings_boost_active ON listings(boost_active_until) WHERE boost_active_until > NOW();

-- Table boost_waitlist
CREATE TABLE IF NOT EXISTS boost_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    desired_tier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ
);
