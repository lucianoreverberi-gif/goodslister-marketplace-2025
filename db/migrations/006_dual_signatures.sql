-- Migration 006: Dual-signature agreement fields on bookings
-- Renter signs first (blocks host check-in), host signs during check-in inspection

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS renter_signed_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS renter_signature_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_signed_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_signature_url TEXT;

-- Dual-signature workflow:
-- 1. Booking confirmed by host
-- 2. Renter must SIGN before host can start check-in inspection
-- 3. Host signs during check-in wizard (existing flow)
-- 4. Both parties can review each other after rental completes
