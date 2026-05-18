import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, listing_id, desired_tier, user_id } = req.body;

    if (!email || !listing_id) {
      return res.status(400).json({ error: 'Email and listing ID are required' });
    }

    await sql`
      INSERT INTO boost_waitlist (email, listing_id, desired_tier, user_id)
      VALUES (${email}, ${listing_id}, ${desired_tier}, ${user_id || null})
    `;

    // Try to send confirmation email
    try {
      await resend.emails.send({
        from: 'Goodslister <team@goodslister.com>',
        to: email,
        subject: 'You are on the list! Boosts are coming soon.',
        html: `
          <h1>Boosts are launching soon!</h1>
          <p>Hi there,</p>
          <p>Thanks for your interest in boosting your listing on Goodslister. We have added you to our waitlist for the <strong>${desired_tier}</strong> tier.</p>
          <p>We'll notify you as soon as this feature goes live for your account.</p>
          <p>Best,<br/>The Goodslister Team</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send waitlist email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({ success: true, message: "You're on the list. We'll email you when boosts go live." });
  } catch (error) {
    console.error('Waitlist error:', error);
    return res.status(500).json({ error: 'Failed to join waitlist' });
  }
}
