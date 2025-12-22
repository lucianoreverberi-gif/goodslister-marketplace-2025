import twilio from 'twilio';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, phoneNumber, code } = req.body;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_SERVICE_SID;

  // FALLBACK MOCK: Si no hay llaves, simulamos éxito para que la app no se trabe en producción/dev
  if (!accountSid || !authToken || !serviceSid) {
      console.warn("Twilio credentials missing. Running in MOCK mode.");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (action === 'send') {
          if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
          return res.status(200).json({ success: true, message: 'Mock code sent (use 123456)', mode: 'mock' });
      }
      if (action === 'verify') {
          if (code === '123456') {
              return res.status(200).json({ success: true, status: 'approved', mode: 'mock' });
          }
          return res.status(400).json({ success: false, message: 'Invalid code (Use 123456 for demo)' });
      }
      return res.status(400).json({ error: 'Invalid action' });
  }

  // REAL TWILIO INTEGRATION
  try {
      const client = twilio(accountSid, authToken);

      if (action === 'send') {
          if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
          
          try {
              const verification = await client.verify.v2.services(serviceSid)
                .verifications
                .create({ to: phoneNumber, channel: 'sms' });
                
              return res.status(200).json({ success: true, status: verification.status });
          } catch (e: any) {
              return res.status(400).json({ error: `Twilio Error: ${e.message}` });
          }
      }

      if (action === 'verify') {
          if (!phoneNumber || !code) return res.status(400).json({ error: 'Phone and code required' });

          try {
              const verificationCheck = await client.verify.v2.services(serviceSid)
                .verificationChecks
                .create({ to: phoneNumber, code: code });

              if (verificationCheck.status === 'approved') {
                  return res.status(200).json({ success: true, status: 'approved' });
              } else {
                  return res.status(400).json({ success: false, message: 'Invalid code or expired.' });
              }
          } catch (e: any) {
              return res.status(400).json({ error: `Verification failed: ${e.message}` });
          }
      }

      return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
      console.error('Twilio critical failure:', error);
      return res.status(500).json({ error: 'Service unavailable' });
  }
}