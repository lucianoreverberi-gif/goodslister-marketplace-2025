import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { stripe } from '../../../lib/stripe.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Determine authenticated user ID from body, query or headers
    const userId = req.body?.userId || req.query?.userId || req.headers['x-user-id'];

    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User is not authenticated. Please log in.'
      });
    }

    // Load user from database
    const userQuery = await sql`
      SELECT id, email, stripe_account_id 
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
    let stripeAccountId = user.stripe_account_id;

    // Create a new Stripe Express account if user doesn't have one
    if (!stripeAccountId) {
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: { goodslister_user_id: user.id },
        });

        stripeAccountId = account.id;

        await sql`
          UPDATE users 
          SET stripe_account_id = ${stripeAccountId} 
          WHERE id = ${user.id}
        `;
      } catch (stripeCreateErr: any) {
        console.error('Failed to create account in Stripe:', stripeCreateErr);
        return res.status(500).json({
          error: 'Stripe error',
          message: stripeCreateErr.message || 'Failed to create Stripe Express account.'
        });
      }
    }

    // Dynamic origin for robust local, preview, and production environments
    const origin = req.headers.origin || 'https://www.goodslister.com';

    // Create Account Link
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${origin}/#stripeOnboardingRefresh`,
        return_url: `${origin}/#stripeOnboardingComplete`,
        type: 'account_onboarding',
      });

      return res.status(200).json({
        url: accountLink.url,
        accountId: stripeAccountId
      });
    } catch (stripeLinkErr: any) {
      console.error('Failed to create account link in Stripe:', stripeLinkErr);
      return res.status(500).json({
        error: 'Stripe error',
        message: stripeLinkErr.message || 'Failed to generate Stripe onboarding link.'
      });
    }

  } catch (error: any) {
    console.error('Create onboarding link handler failed:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
