import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return String(req.socket?.remoteAddress || 'unknown');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, type, photoUrls, conditionRating, conditionNotes, latitude, longitude, signedByHost } = req.body || {};

    if (!bookingId || !type) {
      return res.status(400).json({ error: 'Missing required fields: bookingId, type' });
    }

    if (type !== 'checkin' && type !== 'checkout') {
      return res.status(400).json({ error: 'type must be checkin or checkout' });
    }

    if (!Array.isArray(photoUrls) || photoUrls.length < 4) {
      return res.status(400).json({ error: 'At least 4 photos are required' });
    }

    if (photoUrls.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 photos allowed' });
    }

    if (conditionRating !== undefined && (conditionRating < 1 || conditionRating > 5)) {
      return res.status(400).json({ error: 'conditionRating must be between 1 and 5' });
    }

    // Verify booking exists
    const { rows: bookingRows } = await sql`
      SELECT id, status FROM bookings WHERE id = ${bookingId}
    `;
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const ip = getClientIp(req);
    const now = new Date().toISOString();

    // Check if handoff session exists for this booking + type
    const { rows: existingRows } = await sql`
      SELECT id, status, renter_signed_at, host_signed_at 
      FROM handoff_sessions 
      WHERE booking_id = ${bookingId} AND type = ${type}
      LIMIT 1
    `;

    let sessionId: string;
    let created = false;

    if (existingRows.length === 0) {
      sessionId = 'ho_' + crypto.randomBytes(8).toString('hex');
      created = true;
      await sql`
        INSERT INTO handoff_sessions (
          id, booking_id, type, photo_urls, condition_notes, condition_rating,
          latitude, longitude, status,
          renter_signed_at, renter_signed_ip,
          host_signed_at, host_signed_ip
        ) VALUES (
          ${sessionId}, ${bookingId}, ${type},
          ${photoUrls as any}, ${conditionNotes || null}, ${conditionRating || null},
          ${latitude || null}, ${longitude || null},
          ${signedByHost ? 'host_signed' : 'renter_signed'},
          ${signedByHost ? null : now}, ${signedByHost ? null : ip},
          ${signedByHost ? now : null}, ${signedByHost ? ip : null}
        )
      `;
    } else {
      sessionId = existingRows[0].id;
      const alreadyRenterSigned = existingRows[0].renter_signed_at != null;
      const alreadyHostSigned = existingRows[0].host_signed_at != null;

      let newStatus = existingRows[0].status;
      if (signedByHost && !alreadyHostSigned) newStatus = alreadyRenterSigned ? 'both_signed' : 'host_signed';
      if (!signedByHost && !alreadyRenterSigned) newStatus = alreadyHostSigned ? 'both_signed' : 'renter_signed';

      await sql`
        UPDATE handoff_sessions
        SET photo_urls = ${photoUrls as any},
            condition_notes = COALESCE(${conditionNotes || null}, condition_notes),
            condition_rating = COALESCE(${conditionRating || null}, condition_rating),
            latitude = COALESCE(${latitude || null}, latitude),
            longitude = COALESCE(${longitude || null}, longitude),
            renter_signed_at = COALESCE(renter_signed_at, ${signedByHost ? null : now}),
            renter_signed_ip = COALESCE(renter_signed_ip, ${signedByHost ? null : ip}),
            host_signed_at = COALESCE(host_signed_at, ${signedByHost ? now : null}),
            host_signed_ip = COALESCE(host_signed_ip, ${signedByHost ? ip : null}),
            status = ${newStatus},
            updated_at = NOW()
        WHERE id = ${sessionId}
      `;
    }

    // Update booking timestamps
    if (type === 'checkin') {
      await sql`UPDATE bookings SET checkin_at = COALESCE(checkin_at, NOW()) WHERE id = ${bookingId}`;
    } else if (type === 'checkout') {
      await sql`UPDATE bookings SET checkout_at = COALESCE(checkout_at, NOW()) WHERE id = ${bookingId}`;
    }

    // Auto-trigger deposit release on checkout
    let depositReleased = false;
    let depositReleaseError: string | null = null;
    if (type === 'checkout' && !signedByHost) {
      try {
        const host = req.headers.host || 'www.goodslister.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const releaseRes = await fetch(`${protocol}://${host}/api/bookings/release-deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId })
        });
        const releaseBody = await releaseRes.json();
        depositReleased = !!releaseBody.released || !!releaseBody.alreadyReleased;
        if (!depositReleased && releaseBody.error) depositReleaseError = releaseBody.error;
      } catch (releaseErr) {
        console.warn('Deposit auto-release failed:', releaseErr);
        depositReleaseError = releaseErr instanceof Error ? releaseErr.message : 'Unknown';
      }
    }

    return res.status(200).json({
      success: true,
      created,
      sessionId,
      type,
      depositReleased,
      depositReleaseError
    });
  } catch (error) {
    console.error('Handoff upsert error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
