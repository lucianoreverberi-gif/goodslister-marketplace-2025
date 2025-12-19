import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;

  try {
    // 1. Limpiar listings del usuario (por integridad referencial)
    await sql`DELETE FROM listings WHERE owner_id = ${userId}`;
    
    // 2. Limpiar mensajes y participantes (si aplica)
    await sql`DELETE FROM conversation_participants WHERE user_id = ${userId}`;
    await sql`DELETE FROM messages WHERE sender_id = ${userId}`;

    // 3. Eliminar usuario
    await sql`DELETE FROM users WHERE id = ${userId}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
}