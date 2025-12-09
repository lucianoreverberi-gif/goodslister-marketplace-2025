
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Delete data in order of foreign key constraints
    await sql`DELETE FROM messages`;
    await sql`DELETE FROM conversation_participants`;
    await sql`DELETE FROM conversations`;

    return res.status(200).json({ 
        message: 'All chats have been wiped successfully. You can now start fresh.' 
    });
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
