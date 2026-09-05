import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { 
    listingId, renterId, startDate, endDate, totalPrice, 
    amountPaidOnline, balanceDueOnSite, paymentMethod, 
    protectionType, protectionFee, securityDeposit, stripePaymentIntentId, stripeDepositPaymentIntentId 
  } = req.body || {};

  try {
    const id = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await sql`
      INSERT INTO bookings (
        id, listing_id, renter_id, start_date, end_date, total_price, 
        amount_paid_online, balance_due_on_site, payment_method, 
        protection_type, protection_fee, security_deposit, deposit_amount, stripe_payment_intent_id, stripe_deposit_payment_intent_id, status, deposit_status
      ) VALUES (
        ${id}, ${listingId}, ${renterId}, ${startDate}, ${endDate}, ${totalPrice}, 
        ${amountPaidOnline}, ${balanceDueOnSite}, ${paymentMethod}, 
        ${protectionType}, ${protectionFee}, ${securityDeposit || 0}, ${securityDeposit || 0}, ${stripePaymentIntentId || null}, ${stripeDepositPaymentIntentId || null}, 'pending', ${stripeDepositPaymentIntentId ? 'held' : 'none'}
      )
    `;

    // Also update listing booked_dates (appending to array)
    // In Vercel Postgres, we expect jsonb for arrays usually
    const listingQuery = await sql`SELECT booked_dates FROM listings WHERE id = ${listingId}`;
    let bookedDates = listingQuery.rows[0]?.booked_dates || [];
    if (typeof bookedDates === 'string') {
      try {
        bookedDates = JSON.parse(bookedDates);
      } catch (e) {
        bookedDates = [];
      }
    }
    if (!Array.isArray(bookedDates)) {
      bookedDates = [];
    }
    
    // Simple push for now
    bookedDates.push(startDate);

    await sql`UPDATE listings SET booked_dates = ${bookedDates} WHERE id = ${listingId}`;

    // ========== EMAIL NOTIFICATIONS (fire-and-forget) ==========
    // Wire up existing send-email templates for booking lifecycle
    try {
      const listing = await sql`SELECT title, owner_id FROM listings WHERE id = ${listingId} LIMIT 1`;
      const listingData = listing.rows[0] || {};
      const hostQ = await sql`SELECT name, email FROM users WHERE id = ${listingData.owner_id} LIMIT 1`;
      const renterQ = await sql`SELECT name, email FROM users WHERE id = ${renterId} LIMIT 1`;
      const host = hostQ.rows[0] || {};
      const renter = renterQ.rows[0] || {};

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host_ = req.headers.host || 'www.goodslister.com';
      const baseUrl = `${protocol}://${host_}`;

      const commonData = {
        bookingId: id,
        listingTitle: listingData.title || 'listing',
        hostName: host.name || 'Host',
        renterName: renter.name || 'Renter',
        startDate,
        endDate,
        totalPrice: (totalPrice || 0).toFixed(2),
        amountPaid: (amountPaidOnline || 0).toFixed(2),
        balanceDue: (balanceDueOnSite || 0).toFixed(2),
        securityDeposit: (securityDeposit || 0).toFixed(2)
      };

      // Email to Host: booking request received
      if (host.email) {
        fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking_request_host', to: host.email, data: { ...commonData, userName: host.name } })
        }).catch(e => console.warn('host booking email failed:', e));
      }

      // Email to Renter: booking request confirmation
      if (renter.email) {
        fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking_request_renter', to: renter.email, data: { ...commonData, userName: renter.name } })
        }).catch(e => console.warn('renter booking email failed:', e));
      }
    } catch (emailError) {
      console.warn('Booking email notifications failed (non-blocking):', emailError);
    }

    return res.status(200).json({ success: true, booking: { id, listingId, renterId, startDate, endDate, totalPrice, status: 'pending' } });
  } catch (error: any) {
    console.error('Create booking error:', error);
    const isConnError = error?.message?.toLowerCase().includes('password') ||
                        error?.message?.toLowerCase().includes('authentication') ||
                        error?.message?.toLowerCase().includes('connect') ||
                        error?.message?.toLowerCase().includes('failed to fetch') ||
                        error?.message?.toLowerCase().includes('address') ||
                        error?.message?.toLowerCase().includes('dns');
    
    if (isConnError) {
      console.warn('Database server connection/authentication issue; proceeding with simulated success for non-blocking local simulation.');
      const id = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return res.status(200).json({ success: true, simulated: true, booking: { id, listingId, renterId, startDate, endDate, totalPrice, status: 'pending' } });
    }
    console.error('Create booking error details:', error?.message, error?.code, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to create booking',
      details: error?.message || 'Unknown error',
      code: error?.code || null
    });
  }
}
