
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { Buffer } from 'node:buffer';

// NOTE: In production, you MUST configure STRIPE_WEBHOOK_SECRET in Vercel
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

// Helper to get raw body
async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // If secret isn't set, we can't verify signature, so we fail safely in prod or log in dev
  if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is missing. Webhook cannot verify.');
      return res.status(400).send('Webhook Error: Missing secret');
  }

  const sig = req.headers['stripe-signature'];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  let event: Stripe.Event;

  try {
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Retrieve metadata
    const bookingId = session.metadata?.bookingId;
    const paymentType = session.metadata?.type; // 'rental_payment'

    if (bookingId && paymentType === 'rental_payment') {
        try {
            // 1. Mark Booking as Active/Confirmed
            await sql`
                UPDATE bookings 
                SET status = 'confirmed' 
                WHERE id = ${bookingId}
            `;
            console.log(`Booking ${bookingId} confirmed via Webhook.`);

            // 2. Record Payment in Ledger (Optional but good for robustness)
            const paymentId = `pay-${session.payment_intent}`;
            // ... insert into payments table logic here if needed ...

            // 3. Send Confirmation Email (Redundant if create.ts sends it, but safe as a fallback)
            // Ideally, create.ts sets status to 'pending_payment' and this webhook sets 'confirmed' and sends the email.
            
        } catch (dbError) {
            console.error('Database update failed in webhook:', dbError);
            return res.status(500).send('Database Error');
        }
    }
  }

  return res.status(200).json({ received: true });
}