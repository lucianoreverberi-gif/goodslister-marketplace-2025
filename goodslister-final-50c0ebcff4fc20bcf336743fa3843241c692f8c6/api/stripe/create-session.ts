
import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, amount, bookingId, imageUrl } = req.body;

  if (!title || !amount || !bookingId) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check for Secret Key
  if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is missing. Cannot create session.");
      // Fallback for UI testing if key is missing
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  // Determine Base URL for redirects
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const origin = `${protocol}://${host}`;

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Rental: ${title}`,
              images: imageUrl ? [imageUrl] : [],
              description: `Booking Ref: ${bookingId}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard?payment_success=true&booking_id=${bookingId}`,
      cancel_url: `${origin}/explore`, // Or back to listing
      metadata: {
          bookingId: bookingId,
          type: 'rental_payment'
      }
    });

    return res.status(200).json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create Stripe session' });
  }
}
