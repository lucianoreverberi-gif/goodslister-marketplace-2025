import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

// Ensure table exists (idempotent)
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_user_flags (
      user_id TEXT PRIMARY KEY,
      is_superhost BOOLEAN DEFAULT FALSE,
      superhost_granted_at TIMESTAMPTZ,
      superhost_granted_by TEXT,
      notes TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminEmail = ((req.query.admin_email as string) || (req.body?.admin_email as string) || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }

  try {
    await ensureTable(); try { await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE`; await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ`; await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS suspended_by TEXT`; } catch (e) { console.log('suspend cols migration skip:', e); } try { await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE`; await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ`; await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS suspended_by TEXT`; } catch (e) { console.log('suspend cols migration skip:', e); } try { await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE`; await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ`; await sql`ALTER TABLE admin_user_flags ADD COLUMN IF NOT EXISTS suspended_by TEXT`; } catch (e) { console.log('suspend cols migration skip:', e); }

    // ========= GET: fetch all user flags =========
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT user_id, is_superhost, superhost_granted_at, superhost_granted_by, notes, updated_at
        FROM admin_user_flags
      `;
      const flags: Record<string, any> = {};
      for (const r of rows) {
        flags[r.user_id] = {
          is_superhost: r.is_superhost,
          superhost_granted_at: r.superhost_granted_at,
          superhost_granted_by: r.superhost_granted_by,
          notes: r.notes,
          updated_at: r.updated_at,
        };
      }
      return res.status(200).json({
        flags,
        total: rows.length,
        superhost_count: rows.filter(r => r.is_superhost).length,
        generated_at: new Date().toISOString(),
      });
    }

    // ========= POST: perform action =========
    if (req.method === 'POST') {
      const { user_id, action } = req.body || {};
      if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'user_id required in body' });
      }
      if (!action || typeof action !== 'string') {
        return res.status(400).json({ error: 'action required in body' });
      }

      // Toggle superhost flag
      if (action === 'toggle_superhost') {
        // Check current state
        const { rows: current } = await sql`
          SELECT is_superhost FROM admin_user_flags WHERE user_id = ${user_id}
        `;
        const currentValue = current[0]?.is_superhost || false;
        const newValue = !currentValue;

        if (current.length === 0) {
          // Insert new row
          await sql`
            INSERT INTO admin_user_flags (user_id, is_superhost, superhost_granted_at, superhost_granted_by, updated_at)
            VALUES (${user_id}, ${newValue}, ${newValue ? new Date().toISOString() : null}, ${newValue ? adminEmail : null}, NOW())
          `;
        } else {
          // Update existing
          await sql`
            UPDATE admin_user_flags
            SET is_superhost = ${newValue},
                superhost_granted_at = ${newValue ? new Date().toISOString() : null},
                superhost_granted_by = ${newValue ? adminEmail : null},
                updated_at = NOW()
            WHERE user_id = ${user_id}
          `;
        }

        return res.status(200).json({
          status: 'ok',
          user_id,
          action,
          previous_value: currentValue,
          new_value: newValue,
          message: newValue ? 'â­ User promoted to Superhost' : 'Superhost status removed',
        });
      }

      if (action === 'toggle_suspend') { const { rows: current } = await sql`SELECT is_suspended FROM admin_user_flags WHERE user_id = ${user_id}`; const currentValue = current[0]?.is_suspended || false; const newValue = !currentValue; if (current.length === 0) { await sql`INSERT INTO admin_user_flags (user_id, is_suspended, suspended_at, suspended_by, updated_at) VALUES (${user_id}, ${newValue}, ${newValue ? new Date().toISOString() : null}, ${newValue ? adminEmail : null}, NOW())`; } else { await sql`UPDATE admin_user_flags SET is_suspended = ${newValue}, suspended_at = ${newValue ? new Date().toISOString() : null}, suspended_by = ${newValue ? adminEmail : null}, updated_at = NOW() WHERE user_id = ${user_id}`; } return res.status(200).json({ status: 'ok', user_id, action, previous_value: currentValue, new_value: newValue, message: newValue ? 'User suspended' : 'User unsuspended' }); } return res.status(400).json({ error: `Unknown action: ${action}. Supported: toggle_superhost, toggle_suspend` });
    }

    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  } catch (e: any) {
    console.error('user-flags error:', e);
    return res.status(500).json({ error: e.message, stack: e.stack?.substring(0, 500) });
  }
}

