import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { requireAdmin } from '../_lib/admin-auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  const { key, value } = req.body;

  if (!key || typeof key !== 'string' || !/^[a-z_]+$/.test(key)) {
    return res.status(400).json({ error: 'Invalid key format. Only lowercase letters and underscores allowed.' });
  }

  try {
    await sql`
      INSERT INTO site_config (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value;
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Site Config Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
