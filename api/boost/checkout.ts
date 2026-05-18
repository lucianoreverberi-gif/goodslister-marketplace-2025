import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const STRIPE_ENABLED = process.env.STRIPE_ENABLED === 'true';

const TIER_CONFIG = {
  local: { price: 5.99, days: 3, priceId: process.env.STRIPE_PRICE_ID_LOCAL },
  spotlight: { price: 14.99, days: 7, priceId: process.env.STRIPE_PRICE_ID_SPOTLIGHT },
  regional: { price: 29.99, days: 14, priceId: process.env.STRIPE_PRICE_ID_REGIONAL },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!STRIPE_ENABLED) {
    return res.status(503).json({ error: 'stripe_not_configured' });
  }

  try {
    const { listing_id, tier, user_id } = req.body;

    if (!listing_id || !tier || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
    if (!config) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Verify ownership
    const { rows: listingRows } = await sql`
      SELECT owner_id FROM listings WHERE id = ${listing_id}
    `;
    
    if (listingRows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (listingRows[0].owner_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL}/dashboard?boost_success=1&listing=${listing_id}`,
      cancel_url: `${process.env.VITE_APP_URL}/dashboard`,
      metadata: {
        listing_id,
        user_id,
        tier,
      },
    });

    // Create pending boost record
    await sql`
      INSERT INTO boosts (
        listing_id, user_id, tier, price_paid, stripe_checkout_session_id, status
      ) VALUES (
        ${listing_id}, ${user_id}, ${tier}, ${config.price}, ${session.id}, 'pending'
      )
    `;

    return res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
