import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/legal/acceptance-status?userId=X&documentBundle=universal_core_v2_0&documentVersion=2.0
 *
 * Returns whether a user has accepted the given legal document bundle at the given version.
 * Used by App.tsx to decide whether to block the app behind LegalAcceptanceModal.
 *
 * Returns: { accepted: boolean, acceptedAt?, version? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId as string;
    const documentBundle = (req.query.documentBundle as string) || 'universal_core_v2_0';
    const documentVersion = (req.query.documentVersion as string) || '2.0';

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId query parameter' });
    }

    // Find the latest acceptance for this user + bundle + version
    const result = await sql`
      SELECT id, accepted_at, document_version
      FROM legal_acceptances
      WHERE user_id = ${userId}
        AND document_bundle = ${documentBundle}
        AND document_version = ${documentVersion}
      ORDER BY accepted_at DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return res.status(200).json({
        accepted: false,
        userId,
        documentBundle,
        documentVersion,
      });
    }

    const row = result.rows[0];
    return res.status(200).json({
      accepted: true,
      acceptanceId: row.id,
      acceptedAt: row.accepted_at,
      documentVersion: row.document_version,
    });
  } catch (error: any) {
    console.error('[GET /api/legal/acceptance-status] error:', error);

    // Migration 008 not applied yet
    if (error?.code === '42P01') {
      // Fail open so app is not blocked while migration is pending.
      return res.status(200).json({
        accepted: false,
        _hint: 'Migration 008 pending — treating as not-accepted',
      });
    }

    return res.status(500).json({ error: 'Failed to fetch acceptance status' });
  }
}
