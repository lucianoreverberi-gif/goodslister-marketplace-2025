import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY required');
    stripeClient = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
  }
  return stripeClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing bookingId' });
    }

    // Look up booking
    const { rows } = await sql`
      SELECT id, stripe_deposit_payment_intent_id, deposit_hold_status, deposit_amount
      FROM bookings WHERE id = ${bookingId}
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = rows[0];

    if (!booking.stripe_deposit_payment_intent_id) {
      return res.status(400).json({ error: 'This booking has no deposit hold to release' });
    }

    if (booking.deposit_hold_status === 'released') {
      return res.status(200).json({ success: true, alreadyReleased: true });
    }

    if (booking.deposit_hold_status === 'captured') {
      return res.status(400).json({ error: 'Deposit was already captured (damage claim), cannot release' });
    }

    // Cancel the PaymentIntent - this releases the authorization hold
    const stripe = getStripe();
    const canceled = await stripe.paymentIntents.cancel(booking.stripe_deposit_payment_intent_id);

    // Update booking status
    await sql`
      UPDATE bookings 
      SET deposit_hold_status = 'released' 
      WHERE id = ${bookingId}
    `;

    return res.status(200).json({ 
      success: true, 
      released: true,
      paymentIntentId: canceled.id,
      paymentIntentStatus: canceled.status,
      depositAmount: booking.deposit_amount
    });
  } catch (error) {
    console.error('Release deposit error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

