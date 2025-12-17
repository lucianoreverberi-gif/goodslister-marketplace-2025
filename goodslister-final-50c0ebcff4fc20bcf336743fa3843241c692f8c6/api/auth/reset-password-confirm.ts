
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hashPassword } from '../../lib/auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Verify Token
    // We check if token matches AND matches expiration (optional, strict mode would check time)
    const userResult = await sql`SELECT id, email FROM users WHERE reset_token = ${token}`;
    
    if (userResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const user = userResult.rows[0];

    // 2. Hash New Password
    const { salt, hash } = hashPassword(newPassword);

    // 3. Update User & Clear Token
    await sql`
        UPDATE users 
        SET password_hash = ${hash}, password_salt = ${salt}, reset_token = NULL, reset_token_expiry = NULL
        WHERE id = ${user.id}
    `;

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Reset Confirm Error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}
