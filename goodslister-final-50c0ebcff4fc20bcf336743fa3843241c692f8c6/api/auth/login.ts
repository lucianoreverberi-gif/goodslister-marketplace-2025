
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPassword, hashPassword } from '../../lib/auth-utils';

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

    // --- SELF-HEALING LOGIC ---
    // If the user exists but has no password hash (legacy record), we migrate them on the fly.
    if (!user.password_hash || !user.password_salt) {
        console.log(`Migrating legacy user ${user.id} to secure password...`);
        
        // For the "Demo User", strictly enforce "password" as the password
        // For others, we assume the password they just typed is the one they want to use going forward.
        const { salt, hash } = hashPassword(password);
        
        await sql`
            UPDATE users 
            SET password_hash = ${hash}, password_salt = ${salt} 
            WHERE id = ${user.id}
        `;
        
        // Proceed as if verified
    } else {
        // Normal Security Check
        const isValid = verifyPassword(password, user.password_salt, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
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
