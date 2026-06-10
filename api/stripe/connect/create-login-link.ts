import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { stripe } from '../../../lib/stripe.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const userId = req.body?.userId || req.query?.userId || req.headers['x-user-id'];

    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User is not authenticated. Please log in.'
      });
    }

    // Load user details
    const userQuery = await sql`
      SELECT id, stripe_account_id, stripe_details_submitted 
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

    if (!user.stripe_account_id || !user.stripe_details_submitted) {
      return res.status(400).json({
        error: 'Onboarding not completed',
        message: 'The Stripe onboarding process has not been completed. Please onboard first.'
      });
    }

    try {
      // Create login link for Express Dashboard
      const loginLink = await stripe.accounts.createLoginLink(user.stripe_account_id);

      return res.status(200).json({
        url: loginLink.url
      });
    } catch (stripeLinkErr: any) {
      console.error('Failed to create login link on Stripe:', stripeLinkErr);
      return res.status(500).json({
        error: 'Stripe error',
        message: stripeLinkErr.message || 'Failed to generate Stripe Dashboard login link.'
      });
    }

  } catch (error: any) {
    console.error('Create login link endpoint handler failed:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
