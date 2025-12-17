
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Inline helper to avoid module resolution issues
function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if user exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    const id = `user-${Date.now()}`;
    const registeredDate = new Date().toISOString().split('T')[0];
    const avatarUrl = `https://i.pravatar.cc/150?u=${email}`;

    // SECURE: Hash the password
    const { salt, hash } = hashPassword(password);

    await sql`
        INSERT INTO users (id, name, email, registered_date, avatar_url, is_email_verified, is_phone_verified, is_id_verified, average_rating, total_reviews, password_hash, password_salt)
        VALUES (${id}, ${name}, ${email}, ${registeredDate}, ${avatarUrl}, false, false, false, 0, 0, ${hash}, ${salt})
    `;

    const newUser = { 
        id, 
        name, 
        email, 
        registeredDate, 
        avatarUrl, 
        isEmailVerified: false,
        isPhoneVerified: false,
        isIdVerified: false,
        averageRating: 0,
        totalReviews: 0
    };
    
    return res.status(200).json(newUser);
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}
