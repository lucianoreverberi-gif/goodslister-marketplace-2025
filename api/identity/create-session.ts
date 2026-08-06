import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

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
    const { userId, returnUrl } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Check if user already verified
    const { rows: userRows } = await sql`
      SELECT id, email, name, identity_verified
      FROM users WHERE id = ${userId}
    `;
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRows[0];
    if (user.identity_verified) {
      return res.status(200).json({ success: true, alreadyVerified: true });
    }

    const stripe = getStripe();
    const host = req.headers.host || 'www.goodslister.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const defaultReturnUrl = `${protocol}://${host}/#identityVerified`;

    // Create Stripe Verification Session
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: String(userId),
        user_email: String(user.email || ''),
        user_name: String(user.name || ''),
        purpose: 'renter_verification'
      },
      return_url: returnUrl || defaultReturnUrl,
      options: {
        document: {
          require_matching_selfie: true,
          require_live_capture: true,
          allowed_types: ['driving_license', 'passport', 'id_card']
        }
      }
    });

    // Store in DB
    const verificationId = 'iv_' + crypto.randomBytes(8).toString('hex');
    await sql`
      INSERT INTO identity_verifications (id, user_id, stripe_verification_session_id, status, metadata)
      VALUES (${verificationId}, ${userId}, ${session.id}, ${session.status}, ${JSON.stringify({ type: 'document' })})
    `;

    // Also link the latest session id on the user for quick lookup
    await sql`
      UPDATE users SET stripe_verification_session_id = ${session.id} WHERE id = ${userId}
    `;

    return res.status(200).json({
      success: true,
      verificationId,
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url,
      status: session.status
    });
  } catch (error) {
    console.error('Create identity session error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

