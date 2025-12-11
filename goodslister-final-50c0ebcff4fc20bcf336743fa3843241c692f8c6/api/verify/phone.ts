
import twilio from 'twilio';
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
      // Fallback to mock behavior if env vars are missing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (action === 'send') {
          return res.status(200).json({ success: true, message: 'Mock code sent (use 123456)', mode: 'mock' });
      }
      if (action === 'verify') {
          if (code === '123456') {
              return res.status(200).json({ success: true, status: 'approved', mode: 'mock' });
          }
          return res.status(400).json({ success: false, message: 'Invalid code (Mock)' });
      }
      return res.status(400).json({ error: 'Invalid action' });
  }

  // Real Twilio Client
  try {
      const client = twilio(accountSid, authToken);

      if (action === 'send') {
          if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
          
          // phoneNumber must be E.164 format (e.g. +14155552671)
          // The frontend sanitization handles this, but the API should handle errors gracefully
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
              return res.status(400).json({ success: false, message: 'Invalid code or expired.' });
          }
      }

      return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
      console.error('Twilio API Error:', error);
      return res.status(500).json({ error: error.message || 'Twilio verification failed' });
  }
}