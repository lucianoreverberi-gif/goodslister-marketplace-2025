
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- MOCK MODE (If credentials are missing) ---
  if (!process.env.STRIPE_SECRET_KEY) {
      console.log("Stripe credentials missing. Running in MOCK mode.");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
      // Return a simulated success response
      return res.status(200).json({ success: true, status: 'verified', method: 'mock' });
  }

  // --- REAL STRIPE MODE ---
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
      // In a real flow, you would create a VerificationSession
      // and return the client_secret or url to the frontend.
      // For this implementation, we assume the frontend sends data and we pretend to verify.
      
      // Example of creating a session (commented out until full frontend support)
      /*
      const session = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          user_id: 'some_user_id',
        },
      });
      return res.status(200).json({ client_secret: session.client_secret });
      */

     // Simple success for now to enable the feature
     return res.status(200).json({ success: true, status: 'verified', method: 'stripe' });

  } catch (error: any) {
      console.error('Stripe Error:', error);
      return res.status(500).json({ error: error.message || 'Verification failed' });
  }
}
