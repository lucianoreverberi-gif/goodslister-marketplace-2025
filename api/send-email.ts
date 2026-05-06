import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, data } = request.body;

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email.');
    return response.status(200).json({ success: true, message: 'Email skipped (no API key)' });
  }

  try {
    let subject = 'Goodslister Notification';
    let html = `<p>Notification from Goodslister</p>`;

    if (type === 'welcome') {
      subject = 'Welcome to Goodslister!';
      html = `<h1>Welcome, ${data.name}!</h1><p>Thanks for joining the adventure marketplace.</p>`;
    } else if (type === 'booking_confirmation') {
      subject = 'Booking Confirmed!';
      html = `<h1>Booking Confirmed</h1><p>Your rental for ${data.listingTitle} is confirmed for ${data.startDate}.</p>`;
    }

    await resend.emails.send({
      from: 'Goodslister <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return response.status(500).json({ error: 'Failed to send email' });
  }
}
