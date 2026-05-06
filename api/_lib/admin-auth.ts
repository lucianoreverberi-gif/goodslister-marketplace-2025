import { VercelRequest } from '@vercel/node';

export async function requireAdmin(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized: No token provided' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
    
    if (!response.ok) {
      return { ok: false, status: 401, error: 'Unauthorized: Invalid token' };
    }

    const payload = await response.json();

    if (payload.email === 'lucianoreverberi@gmail.com' && payload.email_verified === 'true') {
      return { ok: true, email: payload.email };
    }

    return { ok: false, status: 403, error: 'Forbidden: Insufficient permissions' };
  } catch (error) {
    console.error('Admin Auth Error:', error);
    return { ok: false, status: 500, error: 'Internal Server Error' };
  }
}
