-- Migration 005: inspection_photos table with 3-tier verification
-- Tracks handover/return photos with EXIF metadata + verification tier

CREATE TABLE IF NOT EXISTS inspection_photos (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('handover', 'return')),
  angle_id TEXT,
  angle_label TEXT,

  -- EXIF metadata (extracted server-side)
  taken_at TIMESTAMP,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  device_model TEXT,
  software TEXT,
  has_exif BOOLEAN DEFAULT false,

  -- 3-tier verification result
  verification_tier TEXT NOT NULL DEFAULT 'PARTIAL' CHECK (verification_tier IN ('VERIFIED', 'PARTIAL', 'REJECTED')),
  verification_flags TEXT[],
  distance_from_pickup_m INTEGER,
  time_diff_minutes INTEGER,

  uploaded_by TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_photos_booking_id ON inspection_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_insp_photos_type ON inspection_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_insp_photos_tier ON inspection_photos(verification_tier);

-- 3-tier logic:
-- VERIFIED: EXIF present + GPS within 2km + timestamp within 1 hour
-- PARTIAL:  Some check missing (no GPS, no timestamp) but not clearly fraudulent
-- REJECTED: EXIF timestamp too old OR GPS too far OR editing software detected
