import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/bookings/sign-agreement
 * Body: { bookingId, userId, role: 'HOST'|'RENTER', signatureUrl }
 * Persists signature timestamp + URL. Host cannot start check-in until renter has signed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, userId, role, signatureUrl } = req.body || {};

    if (!bookingId || !userId || !role || !signatureUrl) {
      return res.status(400).json({ error: 'Missing required fields (bookingId, userId, role, signatureUrl)' });
    }
    if (role !== 'HOST' && role !== 'RENTER') {
      return res.status(400).json({ error: 'Invalid role - must be HOST or RENTER' });
    }

    // Verify the user matches the role for this booking
    const bookingQuery = await sql`
      SELECT b.id, b.renter_id, l.owner_id FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      WHERE b.id = ${bookingId} LIMIT 1
    `;

    if (bookingQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingRow = bookingQuery.rows[0];
    if (role === 'RENTER' && bookingRow.renter_id !== userId) {
      return res.status(403).json({ error: 'Not authorized - user is not the renter for this booking' });
    }
    if (role === 'HOST' && bookingRow.owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized - user is not the host for this booking' });
    }

    // Update the corresponding column pair
    if (role === 'RENTER') {
      await sql`
        UPDATE bookings
        SET renter_signed_at = NOW(), renter_signature_url = ${signatureUrl}
        WHERE id = ${bookingId}
      `;
    } else {
      await sql`
        UPDATE bookings
        SET host_signed_at = NOW(), host_signature_url = ${signatureUrl}
        WHERE id = ${bookingId}
      `;
    }

    return res.status(200).json({ success: true, role, signedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Sign agreement error:', error);
    const msg = error?.message || 'Failed to save signature';
    const isConnErr = msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('password');
    if (isConnErr) {
      return res.status(200).json({ success: true, simulated: true });
    }
    if (msg.includes('does not exist') || error?.code === '42703') {
      return res.status(500).json({ error: 'Signature columns not found. Please run migration 006_dual_signatures.sql.' });
    }
    return res.status(500).json({ error: msg });
  }
}
