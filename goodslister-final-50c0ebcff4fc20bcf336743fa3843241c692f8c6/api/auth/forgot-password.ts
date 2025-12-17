
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Check if user exists
    const userResult = await sql`SELECT id, name FROM users WHERE email = ${email}`;
    
    if (userResult.rows.length === 0) {
        // Security: Do not reveal if email exists or not.
        // We simulate a success delay.
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(200).json({ success: true, message: 'If that email exists, we sent a link.' });
    }

    const user = userResult.rows[0];
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // 2. Save Token to DB (Self-healing schema)
    try {
        await sql`
            UPDATE users 
            SET reset_token = ${resetToken}, reset_token_expiry = NOW() + INTERVAL '1 hour'
            WHERE id = ${user.id}
        `;
    } catch (dbError: any) {
        // If columns don't exist, create them
        if (dbError.code === '42703' || dbError.message?.includes('does not exist')) {
            console.log("Self-healing: Adding reset_token columns...");
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`;
            
            // Retry update
            await sql`
                UPDATE users 
                SET reset_token = ${resetToken}, reset_token_expiry = NOW() + INTERVAL '1 hour'
                WHERE id = ${user.id}
            `;
        } else {
            throw dbError;
        }
    }

    // 3. Send Email
    if (process.env.RESEND_API_KEY) {
        // We use the existing send-email logic or call Resend directly here for simplicity
        const resend = new Resend(process.env.RESEND_API_KEY);
        const link = `https://${req.headers.host}/?reset_token=${resetToken}`;
        
        // Re-using the send-email endpoint logic would be cleaner, but let's do a direct call to ensure it works in this isolation
        // However, to keep styles consistent, we will use the api/send-email endpoint internally
        await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'password_reset',
                to: email,
                data: {
                    name: user.name,
                    resetLink: link
                }
            })
        });
    } else {
        console.warn("RESEND_API_KEY missing. Reset link would be:", `https://${req.headers.host}/?reset_token=${resetToken}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Server error processing request' });
  }
}
