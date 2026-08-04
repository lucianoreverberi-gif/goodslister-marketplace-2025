import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

// Business model constants (mirror admin panel defaults â TODO: read from platform_settings table)
const TRANSACTION_FEE_PERCENT = 3;

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
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
    const { amount, paymentMethodId, listingId, renterId } = request.body;

    if (!amount || !paymentMethodId) {
      return response.status(400).json({ error: 'Missing amount or paymentMethodId' });
    }

    if (!listingId) {
      return response.status(400).json({ error: 'Missing listingId â required for Stripe Connect routing' });
    }

    // Look up listing and host Stripe Connect account
    const { rows } = await sql`
      SELECT 
        l.id AS listing_id,
        l.title AS listing_title,
        l.owner_id AS host_id,
        u.name AS host_name,
        u.email AS host_email,
        u.stripe_account_id,
        u.stripe_charges_enabled
      FROM listings l
      JOIN users u ON u.id = l.owner_id
      WHERE l.id = ${listingId}
    `;

    if (rows.length === 0) {
      return response.status(404).json({ error: `Listing ${listingId} not found` });
    }

    const listing = rows[0];

    if (!listing.stripe_account_id) {
      return response.status(400).json({ 
        error: 'Host has not connected a Stripe account yet',
        code: 'HOST_NO_STRIPE_ACCOUNT'
      });
    }

    if (!listing.stripe_charges_enabled) {
      return response.status(400).json({ 
        error: 'Host Stripe account is not fully activated (charges not enabled)',
        code: 'HOST_STRIPE_NOT_READY'
      });
    }

    // Calculate application fee (platform commission)
    const amountInCents = Math.round(amount * 100);
    const applicationFeeInCents = Math.round(amountInCents * TRANSACTION_FEE_PERCENT / 100);

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      application_fee_amount: applicationFeeInCents,
      transfer_data: {
        destination: listing.stripe_account_id,
      },
      metadata: {
        listing_id: String(listing.listing_id),
        listing_title: String(listing.listing_title || ''),
        host_id: String(listing.host_id),
        host_email: String(listing.host_email || ''),
        renter_id: String(renterId || ''),
        transaction_fee_percent: String(TRANSACTION_FEE_PERCENT),
        purpose: 'rental_booking',
      },
    });

    return response.status(200).json({ 
      success: true, 
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return response.status(500).json({ error: message });
  }
}

