import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId;
    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ error: 'Missing or invalid userId query parameter' });
    }

    const { rows } = await sql`
      SELECT 
        u.identity_verified,
        u.identity_verified_at,
        u.stripe_verification_session_id,
        iv.status AS latest_verification_status,
        iv.failure_reason,
        iv.updated_at AS verification_updated_at
      FROM users u
      LEFT JOIN identity_verifications iv 
        ON iv.stripe_verification_session_id = u.stripe_verification_session_id
      WHERE u.id = ${String(userId)}
      ORDER BY iv.created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const r = rows[0];
    return res.status(200).json({
      verified: !!r.identity_verified,
      verifiedAt: r.identity_verified_at,
      latestSessionId: r.stripe_verification_session_id,
      latestStatus: r.latest_verification_status,
      failureReason: r.failure_reason,
      lastUpdated: r.verification_updated_at
    });
  } catch (error) {
    console.error('Identity status error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

