-- Migration 003: Host-configurable license requirement for listings
-- Enables hosts to indicate whether renters need a license/certification
-- for their gear. Backward compatible - defaults to false.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS license_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_type TEXT;

-- Add explanatory comments
COMMENT ON COLUMN listings.license_required IS 'Whether the renter needs a license/certification to use this gear (host-configured)';
COMMENT ON COLUMN listings.license_type IS 'Optional description of the license needed (e.g. Motorcycle license M, Florida Boating Safety Card)';

-- Index for filtering (rare use case but low cost)
CREATE INDEX IF NOT EXISTS idx_listings_license_required ON listings(license_required) WHERE license_required = true;
