import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = request.body;
  
  if (!userId) {
    return response.status(400).json({ error: 'User ID is required' });
  }

  try {
    if (!process.env.POSTGRES_URL) {
      return response.status(200).json({ conversations: [] });
    }

    // 1. Fetch conversations for this user
    const convosQuery = await sql`
        SELECT c.*, l.title as listing_title, l.id as listing_id
        FROM conversations c
        LEFT JOIN listings l ON c.listing_id = l.id
        WHERE ${userId} = ANY(participant_ids)
        ORDER BY updated_at DESC
    `;

    // 2. For each conversation, fetch messages and participant info
    const conversations = await Promise.all(convosQuery.rows.map(async (convo) => {
        const messagesQuery = await sql`
            SELECT * FROM messages 
            WHERE conversation_id = ${convo.id}
            ORDER BY timestamp ASC
        `;

        // Fetch participant details
        const otherId = convo.participant_ids.find((id: string) => id !== userId) || convo.participant_ids[0];
        const participantQuery = await sql`
            SELECT id, name, avatar_url FROM users WHERE id = ${otherId}
        `;
        
        const participant = participantQuery.rows[0] || {
            id: otherId,
            name: 'Unknown User',
            avatar_url: `https://i.pravatar.cc/150?u=${otherId}`
        };

        return {
            id: convo.id,
            participants: convo.participant_ids.reduce((acc: any, id: string) => {
                // We minimize DB calls by assuming the client has basic info or we provide it for the other user
                if (id === otherId) {
                    acc[id] = { id: participant.id, name: participant.name, avatarUrl: participant.avatar_url };
                } else {
                    acc[id] = { id: userId }; // Current user info usually handled by client
                }
                return acc;
            }, {}),
            messages: messagesQuery.rows.map(m => ({
                id: m.id,
                senderId: m.sender_id,
                text: m.text,
                timestamp: m.timestamp
            })),
            listing: convo.listing_id ? { id: convo.listing_id, title: convo.listing_title } : null,
            updated_at: convo.updated_at
        };
    }));

    return response.status(200).json({ conversations });
  } catch (error) {
    console.error("Error in chat/sync:", error);
    // Silent fail to avoid breaking UI polling
    return response.status(200).json({ conversations: [] });
  }
}
