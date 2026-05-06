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

  const { slides } = req.body;

  if (!Array.isArray(slides)) {
    return res.status(400).json({ error: 'Invalid payload: slides must be an array' });
  }

  try {
    // Wrap in a transaction-like batch if possible, but standard sql tags run sequentially
    await sql`DELETE FROM hero_slides`;

    for (const slide of slides) {
      const { id, title, subtitle, backgroundImage, order } = slide;
      await sql`
        INSERT INTO hero_slides (id, title, subtitle, image_url, background_image, "order")
        VALUES (${id}, ${title}, ${subtitle}, ${backgroundImage}, ${backgroundImage}, ${order})
      `;
    }

    return res.status(200).json({ success: true, count: slides.length });
  } catch (error: any) {
    console.error('Hero Slides Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
