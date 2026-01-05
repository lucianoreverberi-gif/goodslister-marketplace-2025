import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to create tables if they don't exist
async function ensureTablesExist() {
    console.log("Self-healing: Creating missing chat tables...");
    await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(255) PRIMARY KEY,
            listing_id VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS conversation_participants (
            conversation_id VARCHAR(255) REFERENCES conversations(id),
            user_id VARCHAR(255),
            PRIMARY KEY (conversation_id, user_id)
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            conversation_id VARCHAR(255) REFERENCES conversations(id),
            sender_id VARCHAR(255),
            content TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    console.log("Self-healing: Tables created.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Disable Cache
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
  }

  const executeSync = async (retry = true): Promise<any> => {
      try {
        // --- STEP 1: AGGRESSIVE DISCOVERY ---
        const discoveryResult = await sql`
            SELECT DISTINCT c.id as conversation_id
            FROM conversations c
            LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
            LEFT JOIN listings l ON c.listing_id = l.id
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE 
                cp.user_id = ${userId} 
                OR l.owner_id = ${userId}
                OR m.sender_id = ${userId}
        `;
        
        const convoIds = discoveryResult.rows.map(r => r.conversation_id);

        if (convoIds.length === 0) {
            return { conversations: [] };
        }

        // --- STEP 2: AUTO-REPAIR ---
        for (const convoId of convoIds) {
            await sql`
                INSERT INTO conversation_participants (conversation_id, user_id)
                VALUES (${convoId}, ${userId})
                ON CONFLICT (conversation_id, user_id) DO NOTHING
            `;
        }

        // --- STEP 3: FETCH DATA ---
        const conversationsResult = await sql`
            SELECT id, listing_id, updated_at
            FROM conversations 
            WHERE id = ANY(${convoIds as any})
            ORDER BY updated_at DESC
        `;

        const messagesResult = await sql`
            SELECT id, conversation_id, sender_id, content, created_at
            FROM messages
            WHERE conversation_id = ANY(${convoIds as any})
            ORDER BY created_at ASC
        `;

        const participantsResult = await sql`
            SELECT cp.conversation_id, cp.user_id as id, u.name, u.avatar_url
            FROM conversation_participants cp
            LEFT JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ANY(${convoIds as any})
        `;
        
        const listingIds = [...new Set(conversationsResult.rows.map(c => c.listing_id))].filter(id => id);
        let listingsResult = { rows: [] };
        if (listingIds.length > 0) {
            listingsResult = await sql`
                SELECT id, title, images
                FROM listings
                WHERE id = ANY(${listingIds as any})
            `;
        }

        // --- STEP 4: ASSEMBLE ---
        const conversations = conversationsResult.rows.map(convo => {
            const participants = participantsResult.rows
                .filter(p => p.conversation_id === convo.id)
                .reduce((acc, p) => {
                    const displayName = p.name || `User ${p.id.substring(0, 4)}`;
                    const displayAvatar = p.avatar_url || `https://i.pravatar.cc/150?u=${p.id}`;
                    
                    acc[p.id] = { 
                        id: p.id, 
                        name: displayName, 
                        avatarUrl: displayAvatar
                    };
                    return acc;
                }, {} as any);

            const listingRow = listingsResult.rows.find(l => l.id === convo.listing_id);
            const listing = listingRow ? {
                id: listingRow.id,
                title: listingRow.title,
                images: listingRow.images || []
            } : null;

            const messages = messagesResult.rows
                .filter(m => m.conversation_id === convo.id)
                .map(m => ({
                    id: m.id,
                    senderId: m.sender_id,
                    text: m.content,
                    originalText: m.content,
                    timestamp: m.created_at
                }));

            return {
                id: convo.id,
                listing: listing,
                participants,
                messages
            };
        });

        return { conversations };

      } catch (error: any) {
        // AUTO-HEAL: If tables don't exist, create them and retry once
        if (retry && (error.code === '42P01' || error.message?.includes('does not exist'))) {
            await ensureTablesExist();
            return await executeSync(false); // Retry once
        }
        throw error;
      }
  };

  try {
    const result = await executeSync();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat sync error:', error);
    return res.status(500).json({ error: 'Failed to sync chat' });
  }
}