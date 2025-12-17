
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === storedHash;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, currentPassword, newPassword } = req.body;

  try {
    const userRes = await sql`SELECT password_hash, password_salt FROM users WHERE id = ${userId}`;
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userRes.rows[0];
    
    // Verify current
    if (!verifyPassword(currentPassword, user.password_salt, user.password_hash)) {
        return res.status(401).json({ error: 'Current password incorrect' });
    }

    // Hash and save new
    const { salt, hash } = hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${hash}, password_salt = ${salt} WHERE id = ${userId}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update password' });
  }
}
