import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      listingId, renterId, startDate, endDate, totalPrice, 
      amountPaidOnline, balanceDueOnSite, paymentMethod, 
      protectionType, protectionFee, securityDeposit 
    } = req.body;

    const id = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await sql`
      INSERT INTO bookings (
        id, listing_id, renter_id, start_date, end_date, total_price, 
        amount_paid_online, balance_due_on_site, payment_method, 
        protection_type, protection_fee, status, deposit_status
      ) VALUES (
        ${id}, ${listingId}, ${renterId}, ${startDate}, ${endDate}, ${totalPrice}, 
        ${amountPaidOnline}, ${balanceDueOnSite}, ${paymentMethod}, 
        ${protectionType}, ${protectionFee}, 'pending', 'held'
      )
    `;

    // Also update listing booked_dates (appending to array)
    // In Vercel Postgres, we expect jsonb for arrays usually
    const listingQuery = await sql`SELECT booked_dates FROM listings WHERE id = ${listingId}`;
    let bookedDates = listingQuery.rows[0]?.booked_dates || [];
    if (typeof bookedDates === 'string') bookedDates = JSON.parse(bookedDates);
    
    // Simple push for now
    bookedDates.push(startDate);

    await sql`UPDATE listings SET booked_dates = ${JSON.stringify(bookedDates)} WHERE id = ${listingId}`;

    return res.status(200).json({ success: true, booking: { id, listingId, renterId, startDate, endDate, totalPrice, status: 'pending' } });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}
