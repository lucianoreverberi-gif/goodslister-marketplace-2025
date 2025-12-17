
// @ts-ignore: Suppress type resolution error for server-side module in client-side build context
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const LOGO_URL = 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png';
const BRAND_COLOR = '#06B6D4'; // Cyan-600

// --- HTML WRAPPER ---
const wrapHtml = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
    .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { height: 32px; width: auto; }
    .content { padding: 40px 32px; line-height: 1.6; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 24px; text-align: center; }
    .btn:hover { opacity: 0.9; }
    h1 { color: #111827; font-size: 24px; margin-bottom: 16px; font-weight: 700; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Goodslister" class="logo" />
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
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

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { type, to, data } = req.body;

  let subject = '';
  let bodyContent = '';

  switch (type) {
    case 'password_reset':
      subject = 'Reset your password 🔒';
      bodyContent = `
        <h1>Password Reset Request</h1>
        <p>Hi ${data.name || 'User'},</p>
        <p>We received a request to reset your password. Click the button below to set a new one:</p>
        <center>
          <a href="${data.resetLink}" class="btn">Reset Password</a>
        </center>
        <p style="margin-top:20px; font-size:12px; color:#666;">If you didn't request this, ignore this email. Link expires in 1 hour.</p>
      `;
      break;

    case 'welcome':
      subject = 'Welcome to the Adventure! 🛶';
      bodyContent = `
        <h1>Welcome, ${data.name}!</h1>
        <p>We are thrilled to have you join the Goodslister community.</p>
        <center><a href="https://goodslister.com/explore" class="btn">Explore Gear</a></center>
      `;
      break;

    default:
      subject = 'Notification from Goodslister';
      bodyContent = `<p>You have a new update on your account.</p>`;
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `Goodslister <noreply@goodslister.com>`,
      to: [to],
      subject: subject,
      html: wrapHtml(subject, bodyContent),
    });

    if (error) {
      console.error("Resend API Error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: emailData?.id });

  } catch (error) {
    console.error("Email Handler Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
