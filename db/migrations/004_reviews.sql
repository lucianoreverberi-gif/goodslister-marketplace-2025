-- Migration 004: Reviews table for double-blind review system
-- Applied via Neon SQL Editor

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('HOST', 'RENTER')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  private_note TEXT,
  care_rating INTEGER,
  clean_rating INTEGER,
  accuracy_rating INTEGER,
  safety_rating INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'HIDDEN')),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON reviews(target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Double-blind logic:
-- Reviews stay in PENDING status until:
--   1. Counterparty submits their review (both PUBLISHED together)
--   2. 3 days elapse from created_at (auto-publish via cron or lazy check)
