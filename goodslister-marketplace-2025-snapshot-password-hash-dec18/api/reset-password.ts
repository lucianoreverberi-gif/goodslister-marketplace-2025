import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { rows: users } = await sql`
      SELECT id, name, email FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expiry = ${resetTokenExpiry.toISOString()}
      WHERE email = ${email}
    `;

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.goodslister.com'}/reset-password?token=${resetToken}`;

    // Send email with Resend
    try {
      await resend.emails.send({
        from: 'Goodslister <noreply@goodslister.com>',
        to: email,
        subject: 'Reset Your Password - Goodslister',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Goodslister</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #0e7490; margin-top: 0;">Reset Your Password</h2>
              
              <p>Hi ${user.name},</p>
              
              <p>We received a request to reset your password for your Goodslister account. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #06b6d4; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Reset Password</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #06b6d4; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetLink}</p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #666;">
                <strong>This link will expire in 1 hour.</strong><br>
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p>© ${new Date().getFullYear()} Goodslister. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
      });

      return res.status(200).json({ message: 'Password reset email sent successfully.' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
}
