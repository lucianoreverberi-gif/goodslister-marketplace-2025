import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

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
