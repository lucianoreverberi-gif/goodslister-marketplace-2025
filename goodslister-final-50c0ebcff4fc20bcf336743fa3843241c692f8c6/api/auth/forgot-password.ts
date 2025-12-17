
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// HTML wrapper for consistent styling
const LOGO_URL = 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png';
const BRAND_COLOR = '#06B6D4';

const wrapHtml = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <img src="${LOGO_URL}" alt="Goodslister" style="height: 32px; width: auto;" />
    </div>
    <div style="padding: 40px 32px; color: #374151; line-height: 1.6;">
      ${bodyContent}
    </div>
    <div style="background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
      <p>&copy; ${new Date().getFullYear()} Goodslister Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

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
        // Obfuscate result for security
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(200).json({ success: true });
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
        if (dbError.code === '42703' || dbError.message?.includes('does not exist')) {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`;
            await sql`UPDATE users SET reset_token = ${resetToken}, reset_token_expiry = NOW() + INTERVAL '1 hour' WHERE id = ${user.id}`;
        } else {
            throw dbError;
        }
    }

    // 3. Construct Link
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const link = `${protocol}://${host}/?reset_token=${resetToken}`;
    
    // ALWAYS log for safety
    console.log(`CRITICAL: Reset link for ${email}: ${link}`);

    // 4. Send Email DIRECTLY using Resend
    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const subject = 'Reset your Goodslister password 🔒';
        const bodyContent = `
            <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Password Reset Request</h1>
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your password. Click the button below to set a new one:</p>
            <center style="margin: 30px 0;">
              <a href="${link}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
            </center>
            <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
        `;

        await resend.emails.send({
            from: `Goodslister <noreply@goodslister.com>`,
            to: [email],
            subject: subject,
            html: wrapHtml(subject, bodyContent)
        });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Server error processing request' });
  }
}
