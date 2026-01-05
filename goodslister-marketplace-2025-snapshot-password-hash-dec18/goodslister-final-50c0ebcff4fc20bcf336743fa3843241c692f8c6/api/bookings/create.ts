
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

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
    // 1. Fetch Listing Config to check "Instant Book" status
    const listingRes = await sql`
        SELECT title, owner_id, instant_booking_enabled FROM listings WHERE id = ${listingId}
    `;
    
    if (listingRes.rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingRes.rows[0];
    const isInstant = listing.instant_booking_enabled === true;
    
    // Status Logic: Pending if manual, Confirmed if instant
    const initialStatus = isInstant ? 'confirmed' : 'pending';
    const id = `booking-${Date.now()}`;
    
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
            ${initialStatus}, ${protectionType}, ${protectionFee}, ${paymentMethod}
        )
    `;

    // 3. Handle Notifications (Email + Chat)
    if (process.env.RESEND_API_KEY) {
        const renterRes = await sql`SELECT name, email FROM users WHERE id = ${renterId}`;
        const ownerRes = await sql`SELECT name, email FROM users WHERE id = ${listing.owner_id}`;
        
        const renter = renterRes.rows[0];
        const owner = ownerRes.rows[0];
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Notify Renter
        if (renter) {
            await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: isInstant ? 'booking_confirmation' : 'booking_request_sent', // Needs new type for pending
                    to: renter.email,
                    data: {
                        name: renter.name,
                        listingTitle: listing.title,
                        startDate: new Date(startDate).toLocaleDateString(),
                        endDate: new Date(endDate).toLocaleDateString(),
                        totalPrice: totalPrice,
                        paymentMethod: paymentMethod
                    }
                })
            });
        }

        // Notify Owner
        if (owner) {
             await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'booking_request', // Works for both, adjust content based on status
                    to: owner.email,
                    data: {
                        renterName: renter.name,
                        listingTitle: listing.title,
                        startDate: new Date(startDate).toLocaleDateString(),
                        endDate: new Date(endDate).toLocaleDateString(),
                        payoutAmount: balanceDueOnSite,
                        isInstant: isInstant
                    }
                })
            });
        }
    }

    // 4. Send System Message to Chat
    const chatMsg = isInstant 
        ? `✅ Booking Confirmed automatically! Dates: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}.`
        : `📅 New Booking Request sent for ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}. Pending approval.`;

    await fetch(new URL('/api/chat/send', `https://${req.headers.host}`).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderId: renterId,
            text: chatMsg,
            listingId: listingId,
            recipientId: listing.owner_id
        })
    });

    const booking = {
        id,
        listingId,
        renterId,
        startDate,
        endDate,
        totalPrice,
        amountPaidOnline,
        balanceDueOnSite,
        status: initialStatus,
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
