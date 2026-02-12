
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
      listingId, 
      renterId, 
      startDate, 
      endDate, 
      totalPrice, 
      amountPaidOnline, 
      balanceDueOnSite, 
      paymentMethod, 
      protectionType, 
      protectionFee 
  } = req.body;

  if (!listingId || !renterId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required booking fields' });
  }

  try {
    // 1. Fetch Listing to check for Instant Book status
    const listingRes = await sql`SELECT is_instant_book FROM listings WHERE id = ${listingId}`;
    const isInstant = listingRes.rows.length > 0 ? listingRes.rows[0].is_instant_book : false;
    
    const id = `booking-${Date.now()}`;
    const status = isInstant ? 'confirmed' : 'pending';
    
    // 2. Insert Booking
    await sql`
        INSERT INTO bookings (
            id, listing_id, renter_id, start_date, end_date, 
            total_price, amount_paid_online, balance_due_on_site, 
            status, protection_type, protection_fee, payment_method
        )
        VALUES (
            ${id}, ${listingId}, ${renterId}, ${startDate}, ${endDate},
            ${totalPrice}, ${amountPaidOnline || 0}, ${balanceDueOnSite || 0},
            ${status}, ${protectionType}, ${protectionFee}, ${paymentMethod}
        )
    `;

    const booking = {
        id,
        listingId,
        renterId,
        startDate,
        endDate,
        totalPrice,
        amountPaidOnline,
        balanceDueOnSite,
        status: status,
        protectionType,
        protectionFee,
        paymentMethod
    };

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}
