import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist - update via env var later
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

const DEFAULT_SETTINGS = {
  price_threshold: 100,
  low_value_fee: 10,
  high_value_fee: 25,
  transaction_fee_percent: 3
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT price_threshold, low_value_fee, high_value_fee, transaction_fee_percent, updated_at
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
      const { priceThreshold, lowValueFee, highValueFee, transactionFeePercent, adminEmail } = req.body || {};

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
      if (priceThreshold < 0 || lowValueFee < 0 || highValueFee < 0) {
        return res.status(400).json({ error: 'Values must be non-negative' });
      }

      await sql`
        UPDATE platform_settings
        SET price_threshold = ${priceThreshold},
            low_value_fee = ${lowValueFee},
            high_value_fee = ${highValueFee},
            transaction_fee_percent = ${transactionFeePercent},
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

