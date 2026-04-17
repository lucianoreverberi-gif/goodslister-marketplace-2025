import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' });
  }
  return stripeClient;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, paymentMethodId } = request.body;

    if (!amount || !paymentMethodId) {
      return response.status(400).json({ error: 'Missing amount or paymentMethodId' });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    return response.status(200).json({ success: true, paymentIntent });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return response.status(500).json({ error: message });
  }
}
