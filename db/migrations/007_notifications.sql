-- Migration 007: notifications table
-- Powers the in-app notification bell (renter/host events)
-- Applied to Neon: Sep 9, 2026

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,          -- recipient (Firebase UID)
  type TEXT NOT NULL,             -- e.g. booking_pending, booking_approved, contract_signed
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id TEXT,                -- optional link to booking
  listing_id TEXT,                -- optional link to listing
  action_url TEXT,                -- deep link when clicked (e.g. #userDashboard)
  read_at TIMESTAMP,              -- NULL = unread
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);
