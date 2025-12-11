
import { Twilio } from 'twilio';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, phoneNumber, code } = req.body;

  // IMPORTANT: Ensure these are set in Vercel Settings
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
      console.error("Twilio credentials missing in Environment Variables.");
      // Fallback to mock behavior if env vars are missing (for local dev safety)
      // BUT for production, you must set them.
      console.log("Running in MOCK mode due to missing credentials.");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (action === 'send') {
          return res.status(200).json({ success: true, message: 'Mock code sent (use 123456)' });
      }
      if (action === 'verify') {
          if (code === '123456') {
              return res.status(200).json({ success: true, status: 'approved' });
          }
          return res.status(400).json({ success: false, message: 'Invalid code (Mock)' });
      }
      return res.status(400).json({ error: 'Invalid action' });
  }

  // Real Twilio Client
  const client = new Twilio(accountSid, authToken);

  try {
      if (action === 'send') {
          if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
          
          // Note: phoneNumber must be E.164 format (e.g. +14155552671)
          const verification = await client.verify.v2.services(serviceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });
            
          return res.status(200).json({ success: true, status: verification.status });
      }

      if (action === 'verify') {
          if (!phoneNumber || !code) return res.status(400).json({ error: 'Phone and code required' });

          const verificationCheck = await client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });

          if (verificationCheck.status === 'approved') {
              return res.status(200).json({ success: true, status: 'approved' });
          } else {
              return res.status(400).json({ success: false, message: 'Invalid code' });
          }
      }

      return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
      console.error('Twilio Error:', error);
      // Return a safe error message to client
      return res.status(500).json({ error: error.message || 'Twilio verification failed' });
  }
}
