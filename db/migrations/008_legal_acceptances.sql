-- Migration 008: legal acceptances
-- Records user acceptance of legal document bundles (Universal Core, Transactional, etc.)
-- Enforceable audit trail for future disputes (per Fla. Stat. § 668.004 + ESIGN Act)

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Firebase UID
  document_bundle TEXT NOT NULL,            -- 'universal_core_v2_0' | 'transactional_core' | 'annex_A' etc
  document_version TEXT NOT NULL,           -- '2.0' - matches LEGAL_VERSION constant
  content_hash TEXT,                        -- optional SHA-256 of exact text shown (future)
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,                          -- audit trail (from x-forwarded-for)
  user_agent TEXT,                          -- browser + device info
  session_id TEXT                           -- optional session tracker
);

-- Fast lookup: does this user have acceptance for this bundle?
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_bundle
  ON legal_acceptances(user_id, document_bundle);

-- Fast lookup: latest accepted version per user per bundle
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_version
  ON legal_acceptances(user_id, document_bundle, accepted_at DESC);

-- Global stats: which version has been accepted the most
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_version
  ON legal_acceptances(document_version);
