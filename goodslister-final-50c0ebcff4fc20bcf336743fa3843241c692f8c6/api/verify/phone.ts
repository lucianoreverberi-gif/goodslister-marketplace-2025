
import { Twilio } from 'twilio';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, phoneNumber, code } = req.body;

  // --- MOCK MODE (If credentials are missing) ---
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_SERVICE_SID) {
      console.log("Twilio credentials missing. Running in MOCK mode.");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
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

  // --- REAL TWILIO MODE ---
  const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const serviceSid = process.env.TWILIO_SERVICE_SID;

  try {
      if (action === 'send') {
          if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
          
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
      return res.status(500).json({ error: error.message || 'Twilio verification failed' });
  }
}
