import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist - update via env var later
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

const DEFAULT_SETTINGS = {
  price_threshold: 100,
  low_value_fee: 10,
  high_value_fee: 25,
  transaction_fee_percent: 3,
  renter_fee_mode: 'tiered',
  renter_fee_percent: 10,
  renter_fee_min: 10,
  // Insurance / Protection Fee configuration
  insurance_strategy: 'self_pool',    // 'percentage' | 'tiered' | 'self_pool'
  insurance_deductible: 250,           // Option B production default (balanced)
  insurance_percent_rate: 15,
  insurance_percent_min: 5,
  insurance_tier1_limit: 100,
  insurance_tier1_fee: 10,
  insurance_tier2_limit: 500,
  insurance_tier2_fee: 35,
  insurance_tier3_fee: 75,
  // Self-insurance pool (repairs only, no liability)
  pool_max_combined_value: 5000,     // item + rental combined limit
  pool_rate_percent: 1.5,             // Option B: 1.5% of item value (balanced, adjustable)
  pool_min_premium: 10,               // floor per booking (Option B)
  pool_max_payout_ratio: 1,           // max payout = item_value * ratio (1 = 100%)
  pool_reserve_multiplier: 3          // pool must hold 3x max_payout to accept new bookings
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Idempotent schema migration - safe to run on every request
  try {
    await sql`
      ALTER TABLE platform_settings
      ADD COLUMN IF NOT EXISTS renter_fee_mode TEXT DEFAULT 'tiered',
      ADD COLUMN IF NOT EXISTS renter_fee_percent NUMERIC DEFAULT 10,
      ADD COLUMN IF NOT EXISTS renter_fee_min NUMERIC DEFAULT 10,
      ADD COLUMN IF NOT EXISTS insurance_strategy TEXT DEFAULT 'self_pool',
      ADD COLUMN IF NOT EXISTS insurance_deductible NUMERIC DEFAULT 250,
      ADD COLUMN IF NOT EXISTS insurance_percent_rate NUMERIC DEFAULT 15,
      ADD COLUMN IF NOT EXISTS insurance_percent_min NUMERIC DEFAULT 5,
      ADD COLUMN IF NOT EXISTS insurance_tier1_limit NUMERIC DEFAULT 100,
      ADD COLUMN IF NOT EXISTS insurance_tier1_fee NUMERIC DEFAULT 10,
      ADD COLUMN IF NOT EXISTS insurance_tier2_limit NUMERIC DEFAULT 500,
      ADD COLUMN IF NOT EXISTS insurance_tier2_fee NUMERIC DEFAULT 35,
      ADD COLUMN IF NOT EXISTS insurance_tier3_fee NUMERIC DEFAULT 75,
      ADD COLUMN IF NOT EXISTS pool_max_combined_value NUMERIC DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS pool_rate_percent NUMERIC DEFAULT 1.5,
      ADD COLUMN IF NOT EXISTS pool_min_premium NUMERIC DEFAULT 10,
      ADD COLUMN IF NOT EXISTS pool_max_payout_ratio NUMERIC DEFAULT 1,
      ADD COLUMN IF NOT EXISTS pool_reserve_multiplier NUMERIC DEFAULT 3
    `;
  } catch (e) {
    console.warn('Schema migration warning:', e);
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT price_threshold, low_value_fee, high_value_fee, transaction_fee_percent, renter_fee_mode, renter_fee_percent, renter_fee_min, insurance_strategy, insurance_deductible, insurance_percent_rate, insurance_percent_min, insurance_tier1_limit, insurance_tier1_fee, insurance_tier2_limit, insurance_tier2_fee, insurance_tier3_fee, pool_max_combined_value, pool_rate_percent, pool_min_premium, pool_max_payout_ratio, pool_reserve_multiplier, updated_at
        FROM platform_settings WHERE id = 1
      `;
      const settings = rows[0] || DEFAULT_SETTINGS;
      return res.status(200).json(settings);
    } catch (error) {
      // If table doesn't exist yet, return defaults instead of erroring out
      console.warn('Settings GET fallback to defaults:', error);
      return res.status(200).json(DEFAULT_SETTINGS);
    }
  }

  if (req.method === 'POST') {
    try {
      const { priceThreshold, lowValueFee, highValueFee, transactionFeePercent, renterFeeMode, renterFeePercent, renterFeeMin, insuranceStrategy, insuranceDeductible, insurancePercentRate, insurancePercentMin, insuranceTier1Limit, insuranceTier1Fee, insuranceTier2Limit, insuranceTier2Fee, insuranceTier3Fee, poolMaxCombinedValue, poolRatePercent, poolMinPremium, poolMaxPayoutRatio, poolReserveMultiplier, adminEmail } = req.body || {};

      // Admin auth
      if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Validation
      const values = [priceThreshold, lowValueFee, highValueFee, transactionFeePercent];
      if (values.some(function(v) { return typeof v !== 'number' || Number.isNaN(v); })) {
        return res.status(400).json({ error: 'All fields must be numbers' });
      }
      if (transactionFeePercent < 0 || transactionFeePercent > 100) {
        return res.status(400).json({ error: 'Transaction fee percent must be 0-100' });
      }
      // Validate new renter fee fields (optional for backwards compat)
      if (renterFeeMode !== undefined && renterFeeMode !== 'tiered' && renterFeeMode !== 'percentage') {
        return res.status(400).json({ error: 'renterFeeMode must be "tiered" or "percentage"' });
      }
      if (renterFeePercent !== undefined) {
        if (typeof renterFeePercent !== 'number' || Number.isNaN(renterFeePercent) || renterFeePercent < 0 || renterFeePercent > 100) {
          return res.status(400).json({ error: 'renterFeePercent must be a number 0-100' });
        }
      }
      if (renterFeeMin !== undefined) {
        if (typeof renterFeeMin !== 'number' || Number.isNaN(renterFeeMin) || renterFeeMin < 0) {
          return res.status(400).json({ error: 'renterFeeMin must be a non-negative number' });
        }
      }
      if (priceThreshold < 0 || lowValueFee < 0 || highValueFee < 0) {
        return res.status(400).json({ error: 'Values must be non-negative' });
      }

      await sql`
        UPDATE platform_settings
        SET price_threshold = ${priceThreshold},
            low_value_fee = ${lowValueFee},
            high_value_fee = ${highValueFee},
            transaction_fee_percent = ${transactionFeePercent},
            renter_fee_mode = ${renterFeeMode || 'tiered'},
            renter_fee_percent = ${renterFeePercent != null ? renterFeePercent : 10},
            renter_fee_min = ${renterFeeMin != null ? renterFeeMin : 10},
            insurance_strategy = ${insuranceStrategy || 'self_pool'},
            insurance_deductible = ${insuranceDeductible != null ? insuranceDeductible : 250},
            insurance_percent_rate = ${insurancePercentRate != null ? insurancePercentRate : 15},
            insurance_percent_min = ${insurancePercentMin != null ? insurancePercentMin : 5},
            insurance_tier1_limit = ${insuranceTier1Limit != null ? insuranceTier1Limit : 100},
            insurance_tier1_fee = ${insuranceTier1Fee != null ? insuranceTier1Fee : 10},
            insurance_tier2_limit = ${insuranceTier2Limit != null ? insuranceTier2Limit : 500},
            insurance_tier2_fee = ${insuranceTier2Fee != null ? insuranceTier2Fee : 35},
            insurance_tier3_fee = ${insuranceTier3Fee != null ? insuranceTier3Fee : 75},
            pool_max_combined_value = ${poolMaxCombinedValue != null ? poolMaxCombinedValue : 5000},
            pool_rate_percent = ${poolRatePercent != null ? poolRatePercent : 1.5},
            pool_min_premium = ${poolMinPremium != null ? poolMinPremium : 10},
            pool_max_payout_ratio = ${poolMaxPayoutRatio != null ? poolMaxPayoutRatio : 1},
            pool_reserve_multiplier = ${poolReserveMultiplier != null ? poolReserveMultiplier : 3},
            updated_at = NOW()
        WHERE id = 1
      `;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Settings POST error:', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

