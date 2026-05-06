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

  const { banners } = req.body;

  if (!Array.isArray(banners)) {
    return res.status(400).json({ error: 'Invalid payload: banners must be an array' });
  }

  try {
    await sql`DELETE FROM banners`;

    for (const banner of banners) {
      const { id, title, description, buttonText, imageUrl, layout, linkUrl } = banner;
      await sql`
        INSERT INTO banners (id, title, description, button_text, image_url, layout, link_url)
        VALUES (${id}, ${title}, ${description}, ${buttonText}, ${imageUrl}, ${layout}, ${linkUrl})
      `;
    }

    return res.status(200).json({ success: true, count: banners.length });
  } catch (error: any) {
    console.error('Banners Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
