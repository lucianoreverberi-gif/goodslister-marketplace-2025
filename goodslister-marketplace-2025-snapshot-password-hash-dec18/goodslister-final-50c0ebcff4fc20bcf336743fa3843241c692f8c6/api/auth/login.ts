
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPassword } from '../../lib/auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // SECURITY CHECK
    if (!user.password_hash || !user.password_salt) {
        // Legacy or social login users might not have password set.
        // For the sake of this migration, we fail, but in prod you might want a reset flow.
        return res.status(401).json({ error: 'Please reset your password to login securely.' });
    }

    const isValid = verifyPassword(password, user.password_salt, user.password_hash);

    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success! Return user data (sanitized)
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        registeredDate: user.registered_date ? new Date(user.registered_date).toISOString().split('T')[0] : '',
        avatarUrl: user.avatar_url,
        isEmailVerified: user.is_email_verified,
        isPhoneVerified: user.is_phone_verified,
        isIdVerified: user.is_id_verified,
        averageRating: Number(user.average_rating),
        totalReviews: user.total_reviews,
        favorites: user.favorites || [],
        role: user.role || 'USER'
    };

    return res.status(200).json(userData);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed due to server error' });
  }
}
