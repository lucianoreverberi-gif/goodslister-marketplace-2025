import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

const ADMIN_EMAIL = 'lucianoreverberi@gmail.com';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyB2D2Pu8ul3zMvU3tk2mxAuEUaAgoTPVX8';

interface AdminAuthResult { ok: boolean; status?: number; error?: string; email?: string; }

async function requireAdmin(req: VercelRequest): Promise<AdminAuthResult> {
  const header = req.headers['authorization'];
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or malformed Authorization header' };
  }
  const idToken = header.slice('Bearer '.length).trim();
  if (!idToken) return { ok: false, status: 401, error: 'Empty token' };
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const errBody: any = await res.json().catch(() => ({}));
      return { ok: false, status: 401, error: `Firebase token verification failed: ${errBody.error?.message || res.status}` };
    }
    const data: any = await res.json();
    const user = (data.users && data.users[0]) || null;
    if (!user) return { ok: false, status: 401, error: 'User not found for this token' };
    if (!user.email) return { ok: false, status: 403, error: 'Token has no email claim' };
    if (user.email !== ADMIN_EMAIL) return { ok: false, status: 403, error: 'Not authorized as admin' };
    if (user.emailVerified !== true) return { ok: false, status: 403, error: 'Email not verified' };
    return { ok: true, email: user.email };
  } catch (e: any) {
    return { ok: false, status: 500, error: `Token verification error: ${e?.message || 'unknown'}` };
  }
}

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
