import type { VercelRequest } from '@vercel/node';

const ADMIN_EMAIL = 'lucianoreverberi@gmail.com';

// Public Firebase Web API key (already in firebase-applet-config.json)
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyB2D2Pu8ul3zMvU3tk2mxAuEUaAgoTPVX8';

export interface AdminAuthResult {
  ok: boolean;
  status?: number;
  error?: string;
  email?: string;
}

export async function requireAdmin(req: VercelRequest): Promise<AdminAuthResult> {
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
      const errBody = await res.json().catch(() => ({}));
      return { ok: false, status: 401, error: `Firebase token verification failed: ${errBody.error?.message || res.status}` };
    }
    const data = await res.json();
    const user = (data.users && data.users[0]) || null;
    if (!user) return { ok: false, status: 401, error: 'User not found for this token' };
    if (!user.email) return { ok: false, status: 403, error: 'Token has no email claim' };
    if (user.email !== ADMIN_EMAIL) return { ok: false, status: 403, error: 'Not authorized as admin' };
    if (user.emailVerified !== true) return { ok: false, status: 403, error: 'Email not verified' };
    return { ok: true, email: user.email };
  } catch (e) {
    return { ok: false, status: 500, error: `Token verification error: ${(e as Error).message}` };
  }
}
