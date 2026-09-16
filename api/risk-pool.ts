import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

// Idempotent schema for the self-insurance pool + transactions ledger.
// Runs on every request but is a no-op after first success.
async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS risk_pool (
      id INTEGER PRIMARY KEY,
      balance NUMERIC NOT NULL DEFAULT 0,
      total_inflow NUMERIC NOT NULL DEFAULT 0,
      total_outflow NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO risk_pool (id, balance, total_inflow, total_outflow)
    VALUES (1, 0, 0, 0)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS risk_pool_transactions (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      booking_id TEXT,
      listing_id TEXT,
      item_value NUMERIC,
      description TEXT,
      balance_after NUMERIC NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_rpt_created_at ON risk_pool_transactions(created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_rpt_booking ON risk_pool_transactions(booking_id)
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
  } catch (e) {
    console.warn('risk_pool schema warning:', e);
  }

  if (req.method === 'GET') {
    try {
      const poolRows = await sql`
        SELECT balance, total_inflow, total_outflow, updated_at
        FROM risk_pool WHERE id = 1
      `;
      const pool = poolRows.rows[0] || { balance: 0, total_inflow: 0, total_outflow: 0 };

      const txnRows = await sql`
        SELECT id, type, amount, booking_id, listing_id, item_value,
               description, balance_after, created_by, created_at
        FROM risk_pool_transactions
        ORDER BY created_at DESC
        LIMIT 50
      `;

      // Compute solvency status from platform_settings
      let reserveThreshold = 0;
      let canAcceptNew = true;
      try {
        const settingsRows = await sql`
          SELECT pool_max_payout_ratio, pool_reserve_multiplier, pool_max_combined_value
          FROM platform_settings WHERE id = 1
        `;
        const s = settingsRows.rows[0];
        if (s) {
          const maxPayout = Number(s.pool_max_combined_value || 5000) * Number(s.pool_max_payout_ratio || 1);
          reserveThreshold = maxPayout * Number(s.pool_reserve_multiplier || 3);
          canAcceptNew = Number(pool.balance) >= reserveThreshold;
        }
      } catch (e) {
        console.warn('Could not compute solvency:', e);
      }

      return res.status(200).json({
        balance: Number(pool.balance),
        total_inflow: Number(pool.total_inflow),
        total_outflow: Number(pool.total_outflow),
        updated_at: pool.updated_at,
        reserve_threshold: reserveThreshold,
        can_accept_new: canAcceptNew,
        transactions: txnRows.rows.map(function(t) {
          return {
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            booking_id: t.booking_id,
            listing_id: t.listing_id,
            item_value: t.item_value != null ? Number(t.item_value) : null,
            description: t.description,
            balance_after: Number(t.balance_after),
            created_by: t.created_by,
            created_at: t.created_at
          };
        })
      });
    } catch (error) {
      console.error('risk-pool GET error:', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { type, amount, bookingId, listingId, itemValue, description, adminEmail, createdBy } = req.body || {};

      // Auth model:
      //  - System-generated premium (type='premium' with bookingId): no admin required.
      //    This is called from the booking accept flow.
      //  - All other transactions (claim, adjustment, manual premium): admin required.
      const isSystemPremium = type === 'premium' && bookingId && typeof bookingId === 'string';
      if (!isSystemPremium) {
        if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
          return res.status(403).json({ error: 'Not authorized' });
        }
      }

      // Idempotency: skip if a premium for this booking is already logged.
      if (isSystemPremium) {
        const existing = await sql`
          SELECT id, balance_after FROM risk_pool_transactions
          WHERE booking_id = ${bookingId} AND type = 'premium'
          LIMIT 1
        `;
        if (existing.rows.length > 0) {
          return res.status(200).json({
            success: true,
            skipped: true,
            reason: 'Premium already logged for this booking',
            transactionId: existing.rows[0].id,
            newBalance: Number(existing.rows[0].balance_after)
          });
        }
      }

      if (!type || !['premium', 'claim', 'adjustment'].includes(type)) {
        return res.status(400).json({ error: 'type must be premium, claim, or adjustment' });
      }
      if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'amount must be a positive number' });
      }

      // Determine signed delta: premium adds, claim subtracts, adjustment can be either
      // (positive amount = add; use type=claim to subtract; adjustment always adds)
      const delta = type === 'claim' ? -amount : amount;

      // Read current balance, compute new, update in a transaction-like flow
      const poolRows = await sql`SELECT balance, total_inflow, total_outflow FROM risk_pool WHERE id = 1`;
      const current = poolRows.rows[0] || { balance: 0, total_inflow: 0, total_outflow: 0 };
      const currentBalance = Number(current.balance);
      const newBalance = currentBalance + delta;

      if (type === 'claim' && newBalance < 0) {
        return res.status(400).json({ error: 'Insufficient pool balance for this claim' });
      }

      const newInflow = Number(current.total_inflow) + (delta > 0 ? delta : 0);
      const newOutflow = Number(current.total_outflow) + (delta < 0 ? -delta : 0);

      await sql`
        UPDATE risk_pool
        SET balance = ${newBalance},
            total_inflow = ${newInflow},
            total_outflow = ${newOutflow},
            updated_at = NOW()
        WHERE id = 1
      `;

      const insertResult = await sql`
        INSERT INTO risk_pool_transactions
          (type, amount, booking_id, listing_id, item_value, description, balance_after, created_by)
        VALUES
          (${type}, ${amount}, ${bookingId || null}, ${listingId || null},
           ${itemValue != null ? itemValue : null}, ${description || null},
           ${newBalance}, ${createdBy || adminEmail})
        RETURNING id
      `;

      return res.status(200).json({
        success: true,
        newBalance: newBalance,
        transactionId: insertResult.rows[0]?.id
      });
    } catch (error) {
      console.error('risk-pool POST error:', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
