import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/legal/accept
 *
 * Records user acceptance of a legal document bundle for audit-trail evidence.
 *
 * Enforceable under:
 *   - ESIGN Act (15 U.S.C. § 7001)
 *   - Florida Electronic Signature Act (Fla. Stat. § 668.004)
 *
 * Body: { userId, documentBundle, documentVersion, contentHash? }
 *   - userId: Firebase UID of the accepting user
 *   - documentBundle: 'universal_core_v2_0' (or transactional_core, annex_A etc.)
 *   - documentVersion: '2.0' (matches LEGAL_VERSION constant in LegalPages.tsx)
 *   - contentHash: optional SHA-256 of the exact text shown (future)
 *
 * Returns: { success, acceptanceId, acceptedAt }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, documentBundle, documentVersion, contentHash } = req.body || {};

    if (!userId || !documentBundle || !documentVersion) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'documentBundle', 'documentVersion'],
      });
    }

    // Capture audit metadata from request headers
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      'unknown';

    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    // Insert acceptance record. Duplicates are allowed on purpose:
    // - a user re-accepting after a version bump creates a new row
    // - the "latest per user + bundle" is looked up via ORDER BY accepted_at DESC
    const result = await sql`
      INSERT INTO legal_acceptances (
        user_id, document_bundle, document_version, content_hash,
        ip_address, user_agent
      ) VALUES (
        ${userId}, ${documentBundle}, ${documentVersion}, ${contentHash || null},
        ${ipAddress}, ${userAgent}
      )
      RETURNING id, accepted_at
    `;

    const row = result.rows[0];

    return res.status(200).json({
      success: true,
      acceptanceId: row.id,
      acceptedAt: row.accepted_at,
    });
  } catch (error: any) {
    console.error('[POST /api/legal/accept] error:', error);

    // Common cause: migration 008 not yet applied to Neon
    if (error?.code === '42P01') {
      return res.status(500).json({
        error: 'Database schema not ready',
        hint: 'Migration 008_legal_acceptances.sql needs to be applied to Neon',
      });
    }

    return res.status(500).json({ error: 'Failed to record acceptance' });
  }
}
