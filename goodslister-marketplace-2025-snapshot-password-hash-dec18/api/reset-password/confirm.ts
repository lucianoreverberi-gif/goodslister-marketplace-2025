import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// PBKDF2 hashing function (same as used in registration)
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user with valid token
    const { rows: users } = await sql`
      SELECT id, email, reset_token_expiry 
      FROM users 
      WHERE reset_token = ${token}
    `;

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Check if token has expired
    const expiryDate = new Date(user.reset_token_expiry);
    if (expiryDate < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // Generate new salt and hash password
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newPasswordHash = hashPassword(password, newSalt);

    // Update user's password and clear reset token
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, 
          password_salt = ${newSalt},
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE id = ${user.id}
    `;

    return res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
}
