
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Helper to ensure table exists
async function ensureDisputesTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS disputes (
            id VARCHAR(255) PRIMARY KEY,
            booking_id VARCHAR(255) REFERENCES bookings(id),
            reporter_id VARCHAR(255) REFERENCES users(id),
            reason VARCHAR(50), -- damage, fuel, late, etc.
            description TEXT,
            status VARCHAR(20) DEFAULT 'open', -- open, resolved, escalated
            date_opened TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            amount_involved NUMERIC(10, 2) DEFAULT 0
        );
    `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, reporterId, reason, description } = req.body;

  if (!bookingId || !reporterId || !reason) {
      return res.status(400).json({ error: 'Missing required dispute fields' });
  }

  try {
    const id = `dsp-${Date.now()}`;

    // 1. Create Dispute Record
    try {
        await sql`
            INSERT INTO disputes (id, booking_id, reporter_id, reason, description, status, date_opened)
            VALUES (${id}, ${bookingId}, ${reporterId}, ${reason}, ${description}, 'open', CURRENT_TIMESTAMP)
        `;
    } catch (dbError: any) {
        if (dbError.code === '42P01') { // Table missing
            await ensureDisputesTable();
            // Retry insert
            await sql`
                INSERT INTO disputes (id, booking_id, reporter_id, reason, description, status, date_opened)
                VALUES (${id}, ${bookingId}, ${reporterId}, ${reason}, ${description}, 'open', CURRENT_TIMESTAMP)
            `;
        } else {
            throw dbError;
        }
    }

    // 2. Fetch Contact Info for Emails
    // We need details of both Renter and Owner
    const details = await sql`
        SELECT 
            b.id as booking_id,
            l.title as listing_title,
            r.email as renter_email, r.name as renter_name,
            o.email as owner_email, o.name as owner_name
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        JOIN users r ON b.renter_id = r.id
        JOIN users o ON l.owner_id = o.id
        WHERE b.id = ${bookingId}
    `;

    if (details.rows.length > 0 && process.env.RESEND_API_KEY) {
        const info = details.rows[0];
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // EMAIL 1: NOTIFY RENTER (The Accused)
        await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'dispute_opened_renter',
                to: info.renter_email,
                data: {
                    renterName: info.renter_name,
                    ownerName: info.owner_name,
                    listingTitle: info.listing_title,
                    reason: reason,
                    description: description
                }
            })
        });

        // EMAIL 2: NOTIFY OWNER (The Reporter)
        await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'dispute_opened_owner',
                to: info.owner_email,
                data: {
                    ownerName: info.owner_name,
                    renterName: info.renter_name,
                    listingTitle: info.listing_title,
                    disputeId: id
                }
            })
        });
    }

    return res.status(200).json({ success: true, disputeId: id });

  } catch (error: any) {
    console.error('Create dispute error:', error);
    return res.status(500).json({ error: error.message });
  }
}
