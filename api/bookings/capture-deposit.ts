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
    const { bookingId, captureAmountCents } = req.body || {};
    if (!bookingId || typeof captureAmountCents !== 'number' || captureAmountCents <= 0) {
      return res.status(400).json({ error: 'Missing bookingId or invalid captureAmountCents' });
    }

    const { rows } = await sql`
      SELECT id, stripe_deposit_payment_intent_id, deposit_hold_status, deposit_amount
      FROM bookings WHERE id = ${bookingId}
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = rows[0];

    if (!booking.stripe_deposit_payment_intent_id) {
      return res.status(400).json({ error: 'No deposit hold on this booking' });
    }
    if (booking.deposit_hold_status === 'captured') {
      return res.status(400).json({ error: 'Deposit already captured' });
    }
    if (booking.deposit_hold_status === 'released') {
      return res.status(400).json({ error: 'Deposit already released, cannot capture' });
    }

    const depositCents = Math.round(parseFloat(booking.deposit_amount) * 100);
    if (captureAmountCents > depositCents) {
      return res.status(400).json({ error: `Capture amount exceeds deposit ($${(depositCents/100).toFixed(2)})` });
    }

    const stripe = getStripe();
    const captured = await stripe.paymentIntents.capture(booking.stripe_deposit_payment_intent_id, {
      amount_to_capture: captureAmountCents
    });

    await sql`
      UPDATE bookings SET deposit_hold_status = 'captured' WHERE id = ${bookingId}
    `;

    return res.status(200).json({
      success: true,
      captured: true,
      paymentIntentId: captured.id,
      paymentIntentStatus: captured.status,
      amountCaptured: captureAmountCents,
      depositAmount: booking.deposit_amount
    });
  } catch (error) {
    console.error('Capture deposit error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
