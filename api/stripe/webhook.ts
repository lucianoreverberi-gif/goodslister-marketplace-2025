import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const TIER_DAYS = {
  local: 3,
  spotlight: 7,
  regional: 14
};

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'] as string;
  const rawBody = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret!);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        if (!metadata) break;

        const { listing_id, tier } = metadata;
        const days = TIER_DAYS[tier as keyof typeof TIER_DAYS] || 3;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        await sql`
          UPDATE boosts 
          SET status = 'active', 
              starts_at = NOW(), 
              expires_at = ${expiresAt.toISOString()},
              stripe_payment_intent_id = ${session.payment_intent as string}
          WHERE stripe_checkout_session_id = ${session.id}
        `;

        await sql`
          UPDATE listings 
          SET boost_active_until = ${expiresAt.toISOString()},
              boost_tier_active = ${tier}
          WHERE id = ${listing_id}
        `;
        
        break;
      }

      case 'payment_intent.succeeded': { const intent = event.data.object as Stripe.PaymentIntent; const md = intent.metadata || {}; if (md.purpose === 'rental_booking' && md.host_email) { const grossAmount = (intent.amount || 0) / 100; const platformFee = (intent.application_fee_amount || 0) / 100; const netPayout = grossAmount - platformFee; const h = req.headers.host || 'www.goodslister.com'; const proto = h.includes('localhost') ? 'http' : 'https'; try { const er = await fetch(`${proto}://${h}/api/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment_received', to: md.host_email, data: { netPayout: netPayout.toFixed(2), listingTitle: md.listing_title || 'Your listing', grossAmount: grossAmount.toFixed(2), platformFee: platformFee.toFixed(2), payoutDate: 'Within 2 business days' } }) }); if (!er.ok) console.warn('Failed payment_received email:', er.status); } catch (e) { console.error('payment_received email error:', e); } } break; } case 'identity.verification_session.verified': { const ivs = event.data.object as any; const userId = ivs.metadata && ivs.metadata.user_id; if (userId) { await sql`UPDATE users SET identity_verified = TRUE, identity_verified_at = NOW() WHERE id = ${userId}`; } await sql`UPDATE identity_verifications SET status = 'verified', verified_at = NOW(), updated_at = NOW() WHERE stripe_verification_session_id = ${ivs.id}`; if (userId) { try { const { rows: uRows } = await sql`SELECT email, name FROM users WHERE id = ${userId}`; if (uRows[0]?.email) { const emailHost = req.headers.host || 'www.goodslister.com'; const emailProto = emailHost.includes('localhost') ? 'http' : 'https'; fetch(`${emailProto}://${emailHost}/api/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'identity_verified', to: uRows[0].email, data: { userName: uRows[0].name || '' } }) }).catch(function(e) { console.warn('identity_verified email failed:', e); }); } } catch (e) { console.warn('identity_verified email prep failed:', e); } } break; } case 'identity.verification_session.requires_input': { const ivs = event.data.object as any; const reason = ivs.last_error && ivs.last_error.code; await sql`UPDATE identity_verifications SET status = 'requires_input', failure_reason = ${reason || null}, updated_at = NOW() WHERE stripe_verification_session_id = ${ivs.id}`; try { const { rows: uRows } = await sql`SELECT u.email, u.name FROM users u JOIN identity_verifications iv ON iv.user_id = u.id WHERE iv.stripe_verification_session_id = ${ivs.id} LIMIT 1`; if (uRows[0]?.email) { const emailHost = req.headers.host || 'www.goodslister.com'; const emailProto = emailHost.includes('localhost') ? 'http' : 'https'; fetch(`${emailProto}://${emailHost}/api/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'identity_failed', to: uRows[0].email, data: { userName: uRows[0].name || '' } }) }).catch(function(e) { console.warn('identity_failed email failed:', e); }); } } catch (e) { console.warn('identity_failed email prep failed:', e); } break; } case 'identity.verification_session.processing': { const ivs = event.data.object as any; await sql`UPDATE identity_verifications SET status = 'processing', updated_at = NOW() WHERE stripe_verification_session_id = ${ivs.id}`; break; } case 'identity.verification_session.canceled': { const ivs = event.data.object as any; await sql`UPDATE identity_verifications SET status = 'canceled', updated_at = NOW() WHERE stripe_verification_session_id = ${ivs.id}`; break; } case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        const { rows } = await sql`
          UPDATE boosts 
          SET status = 'refunded' 
          WHERE stripe_payment_intent_id = ${paymentIntentId}
          RETURNING listing_id
        `;

        if (rows.length > 0) {
          await sql`
            UPDATE listings 
            SET boost_active_until = NULL, 
                boost_tier_active = NULL 
            WHERE id = ${rows[0].listing_id}
          `;
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await sql`
          UPDATE boosts 
          SET status = 'failed' 
          WHERE stripe_payment_intent_id = ${intent.id}
        `;
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
