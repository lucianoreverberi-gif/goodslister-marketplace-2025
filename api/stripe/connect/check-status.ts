import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { stripe } from '../../../lib/stripe.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user via query or custom headers
    const userId = req.query?.userId || req.headers['x-user-id'];

    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User is not authenticated. Please log in.'
      });
    }

    // Load user from database
    const userQuery = await sql`
      SELECT id, stripe_account_id 
      FROM users 
      WHERE id = ${userId}
    `;

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authenticated user not found in the database.'
      });
    }

    const user = userQuery.rows[0];

    if (!user.stripe_account_id) {
      return res.status(200).json({
        status: 'not_connected',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      });
    }

    try {
      // Retrieve direct info from Stripe
      const account = await stripe.accounts.retrieve(user.stripe_account_id);

      const chargesEnabled = account.charges_enabled || false;
      const payoutsEnabled = account.payouts_enabled || false;
      const detailsSubmitted = account.details_submitted || false;

      // Sync and update database
      await sql`
        UPDATE users 
        SET stripe_charges_enabled = ${chargesEnabled},
            stripe_payouts_enabled = ${payoutsEnabled},
            stripe_details_submitted = ${detailsSubmitted},
            stripe_onboarding_completed = ${detailsSubmitted}
        WHERE id = ${user.id}
      `;

      return res.status(200).json({
        status: chargesEnabled ? 'active' : 'pending',
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
        requirements: account.requirements || null
      });
    } catch (stripeRetrieveErr: any) {
      console.error('Failed to retrieve Stripe account status:', stripeRetrieveErr);
      return res.status(500).json({
        error: 'Stripe error',
        message: stripeRetrieveErr.message || 'Failed to retrieve connection status from Stripe.'
      });
    }

  } catch (error: any) {
    console.error('Check status endpoint handler failed:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
