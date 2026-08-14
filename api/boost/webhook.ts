import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const resend = new Resend(process.env.RESEND_API_KEY);

// Days per tier - matches checkout.ts
const TIER_DAYS: Record<string, number> = {
  local: 3,
  spotlight: 7,
  regional: 14,
};

const TIER_NAMES: Record<string, string> = {
  local: 'Local Boost',
  spotlight: 'Spotlight',
  regional: 'Regional Hero',
};

// Stripe requires raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Ensure schema columns exist (self-healing, idempotent)
async function ensureSchema(): Promise<void> {
  await sql`
    ALTER TABLE boosts 
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  if (!sig || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Only handle successful checkout completion
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: true, type: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { listing_id, user_id, tier } = session.metadata || {};

  if (!listing_id || !user_id || !tier) {
    console.error('Missing metadata in session:', session.id, session.metadata);
    return res.status(400).json({ error: 'Missing metadata' });
  }

  const days = TIER_DAYS[tier];
  if (!days) {
    console.error('Invalid tier:', tier);
    return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    // Self-heal schema (idempotent, cheap)
    await ensureSchema();

    // Activate the boost record created by checkout.ts
    const paymentIntentId = (session.payment_intent as string) || null;
    let updated;
    if (days === 3) {
      const r = await sql`
        UPDATE boosts SET
          status = 'active',
          activated_at = NOW(),
          expires_at = NOW() + INTERVAL '3 days',
          stripe_payment_intent_id = ${paymentIntentId}
        WHERE stripe_checkout_session_id = ${session.id}
        RETURNING *
      `;
      updated = r.rows;
    } else if (days === 7) {
      const r = await sql`
        UPDATE boosts SET
          status = 'active',
          activated_at = NOW(),
          expires_at = NOW() + INTERVAL '7 days',
          stripe_payment_intent_id = ${paymentIntentId}
        WHERE stripe_checkout_session_id = ${session.id}
        RETURNING *
      `;
      updated = r.rows;
    } else {
      const r = await sql`
        UPDATE boosts SET
          status = 'active',
          activated_at = NOW(),
          expires_at = NOW() + INTERVAL '14 days',
          stripe_payment_intent_id = ${paymentIntentId}
        WHERE stripe_checkout_session_id = ${session.id}
        RETURNING *
      `;
      updated = r.rows;
    }

    if (!updated || updated.length === 0) {
      console.error('Boost not found for session:', session.id);
      return res.status(404).json({ error: 'Boost record not found' });
    }

    const boost = updated[0];

    // Fetch listing + user email for confirmation
    const { rows: infoRows } = await sql`
      SELECT l.title AS listing_title, u.email AS user_email, u.display_name AS user_name
      FROM listings l
      LEFT JOIN users u ON u.id = ${user_id}
      WHERE l.id = ${listing_id}
    `;

    if (infoRows.length > 0 && infoRows[0].user_email) {
      const { listing_title, user_email, user_name } = infoRows[0];
      const tierName = TIER_NAMES[tier] || tier;
      const expiresDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      try {
        await resend.emails.send({
          from: 'Goodslister <team@goodslister.com>',
          to: user_email,
          subject: `Your ${tierName} boost is now active`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
              <h1 style="color: #0891b2; font-size: 28px; margin: 0 0 16px;">Boost Activated</h1>
              <p style="font-size: 16px; color: #333;">Hi ${user_name || 'there'},</p>
              <p style="font-size: 16px; color: #333;">
                Your <strong>${tierName}</strong> boost for <strong>${listing_title}</strong> is now live.
              </p>
              <div style="background: #f0fdff; border-left: 4px solid #0891b2; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 4px 0;"><strong>Duration:</strong> ${days} days</p>
                <p style="margin: 4px 0;"><strong>Expires:</strong> ${expiresDate}</p>
                <p style="margin: 4px 0;"><strong>Amount paid:</strong> $${boost.price_paid}</p>
              </div>
              <p style="font-size: 15px; color: #555;">
                Your listing now appears at the top of relevant searches. We'll track views and inquiries for you.
              </p>
              <p style="margin-top: 28px;">
                <a href="https://www.goodslister.com/#userDashboard" 
                   style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                  View My Boosts
                </a>
              </p>
              <p style="color: #777; font-size: 13px; margin-top: 32px;">
                Best,<br/>The Goodslister Team
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send boost activation email:', emailErr);
        // Don't fail the webhook if email fails - boost is still active
      }
    }

    return res.status(200).json({ 
      received: true, 
      boost_id: boost.id, 
      status: 'active',
      expires_at: boost.expires_at 
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Failed to activate boost', detail: error.message });
  }
}

