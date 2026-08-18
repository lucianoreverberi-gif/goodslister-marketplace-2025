import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin listings moderation endpoint
// GET: fetch listings with moderation filter (?filter=pending|rejected|approved|all, default pending)
// POST: approve/reject listing action

const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Auto-init: add moderation columns if not exist (safe idempotent)
    try {
      await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved'`;
      await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_rejection_reason TEXT`;
      await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMP`;
      await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_reviewed_by TEXT`;
    } catch (e) {
      console.log('Migration skip:', e);
    }

    if (req.method === 'GET') {
      const filter = (req.query.filter as string) || 'pending';
      
      let listings;
      if (filter === 'all') {
        const r = await sql`
          SELECT *
          FROM listings
          ORDER BY id DESC
          LIMIT 100
        `;
        listings = r.rows;
      } else {
        const r = await sql`
          SELECT *
          FROM listings
          WHERE moderation_status = ${filter}
          ORDER BY id DESC
          LIMIT 100
        `;
        listings = r.rows;
      }

      // Stats counts
      let counts = { pending: 0, approved: 0, rejected: 0, total: 0 };
      try {
        const c = await sql`
          SELECT moderation_status, COUNT(*)::int AS c
          FROM listings
          GROUP BY moderation_status
        `;
        for (const row of c.rows) {
          if (row.moderation_status === 'pending') counts.pending = row.c;
          else if (row.moderation_status === 'approved') counts.approved = row.c;
          else if (row.moderation_status === 'rejected') counts.rejected = row.c;
          counts.total += row.c;
        }
      } catch (e) { /* skip */ }

      return res.status(200).json({ listings, counts, filter });
    }

    if (req.method === 'POST') {
      const { admin_email, listing_id, action, reason } = req.body || {};

      if (!ADMIN_EMAILS.includes((admin_email || '').toLowerCase())) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (!listing_id) {
        return res.status(400).json({ error: 'listing_id required' });
      }
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be approve or reject' });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const rejectionReason = action === 'reject' ? (reason || 'No reason provided') : null;

      await sql`
        UPDATE listings
        SET moderation_status = ${newStatus},
            moderation_rejection_reason = ${rejectionReason},
            moderation_reviewed_at = NOW(),
            moderation_reviewed_by = ${admin_email}
        WHERE id = ${listing_id}
      `;

      return res.status(200).json({ 
        success: true, 
        listing_id, 
        new_status: newStatus,
        reviewed_by: admin_email 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('listings-moderation error:', e);
    return res.status(500).json({ error: e.message });
  }
}

