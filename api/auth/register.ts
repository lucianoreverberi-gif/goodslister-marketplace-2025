import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
  ) {
    if (request.method !== 'POST') {
          return response.status(405).json({ error: 'Method not allowed' });
    }

  const { name, email, password } = request.body;

  try {
        if (!process.env.POSTGRES_URL) {
                // Fallback for mock environments
          // Still send welcome email if Resend is configured
          if (process.env.RESEND_API_KEY && email && name) {
                    resend.emails.send({
                                from: 'Goodslister <noreply@goodslister.com>',
                                to: [email],
                                subject: `Welcome to Goodslister, ${name}!`,
                                html: `<p>Hi ${name}, thanks for joining Goodslister!</p>`,
                    }).catch(err => console.warn('Welcome email failed (mock):', err));
          }
                return response.status(200).json({
                          id: `user-${Date.now()}`,
                          name,
                          email,
                          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                          bio: '',
                          registeredDate: new Date().toISOString().split('T')[0],
                          favorites: []
                });
        }

      const id = `user-${Date.now()}`;
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
        const registeredDate = new Date().toISOString().split('T')[0];

      // Insert user into Postgres
      // Uses the actual schema columns expected by app-data.ts
      // (Ensure you have a users table, and if it fails, it will hit the catch block)
      await sql`
            INSERT INTO users (id, name, email, avatar_url, registered_date, favorites)
                  VALUES (${id}, ${name}, ${email}, ${avatarUrl}, ${registeredDate}, '{}'::jsonb)
                        ON CONFLICT (email) DO NOTHING
                            `;

      // Send welcome email server-side (fire and forget)
      if (process.env.RESEND_API_KEY) {
              resend.emails.send({
                        from: 'Goodslister <noreply@goodslister.com>',
                        to: [email],
                        subject: `Welcome to Goodslister, ${name}!`,
                        html: buildWelcomeEmail(name),
              }).catch(err => console.warn('Welcome email failed:', err));
      }

      return response.status(200).json({
              id,
              name,
              email,
              avatarUrl,
              bio: '',
              registeredDate: registeredDate,
              isEmailVerified: false,
              isPhoneVerified: false,
              isIdVerified: false,
              licenseVerified: false,
              favorites: []
      });
  } catch (error) {
        console.error("Error creating user:", error);
        return response.status(500).json({ error: 'Failed to create user' });
  }
}

function buildWelcomeEmail(name: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
          <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
                        <tr><td style="background:#1e3a5f;padding:28px 40px;text-align:center;">
                                  <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">GOODSLISTER</h1>
                                            <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Adventure Rental Marketplace</p>
                                                    </td></tr>
                                                            <tr><td style="padding:40px;">
                                                                      <h2 style="margin:0 0 16px;color:#1e3a5f;">Welcome aboard, ${name}! 🎉</h2>
                                                                                <p style="color:#475569;font-size:15px;line-height:1.7;">Your account is ready. Browse adventure gear, rent equipment, or list your own gear for others to enjoy.</p>
                                                                                          <a href="https://www.goodslister.com" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Explore Goodslister</a>
                                                                                                  </td></tr>
                                                                                                          <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                                                                                                                    <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; 2026 Goodslister &middot; goodslister.com</p>
                                                                                                                            </td></tr>
                                                                                                                                  </table>
                                                                                                                                      </td></tr>
                                                                                                                                        </table>
                                                                                                                                        </body>
                                                                                                                                        </html>`;
}
