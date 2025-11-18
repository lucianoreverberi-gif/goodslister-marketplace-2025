// api/users.ts
// Vercel serverless function for user management
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, handleDbError } from './db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    return handleGetUsers(req, res);
  } else if (req.method === 'POST') {
    return handleCreateUser(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdateUser(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET /api/users - Fetch all users or specific user by ID
async function handleGetUsers(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;
    
    if (id) {
      const { rows } = await sql`
        SELECT id, name, email, avatar_url, bio, location, is_admin,
               created_at, updated_at
        FROM users
        WHERE id = ${id as string}
      `;
      return res.status(200).json(rows[0] || null);
    }
    
    const { rows } = await sql`
      SELECT id, name, email, avatar_url, bio, location, is_admin,
             created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json(handleDbError(error));
  }
}

// POST /api/users - Create a new user
async function handleCreateUser(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, email, avatar_url, bio, location } = req.body;
    
    const { rows } = await sql`
      INSERT INTO users (name, email, avatar_url, bio, location)
      VALUES (${name}, ${email}, ${avatar_url || null}, ${bio || null}, ${location || null})
      RETURNING *
    `;
    
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json(handleDbError(error));
  }
}

// PUT /api/users - Update an existing user
async function handleUpdateUser(req: VercelRequest, res: VercelResponse) {
  try {
    const { id, name, email, avatar_url, bio, location } = req.body;
    
    const { rows } = await sql`
      UPDATE users
      SET name = ${name},
          email = ${email},
          avatar_url = ${avatar_url},
          bio = ${bio},
          location = ${location},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json(handleDbError(error));
  }
}
