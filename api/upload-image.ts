import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return response.status(401).json({ error: auth.error });
  }

  const { filename, folder } = request.query;

  if (!filename || Array.isArray(filename)) {
    return response.status(400).json({ error: 'Filename is required' });
  }

  // Validate extension
  const filenameStr = String(filename);
  const extension = filenameStr.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!allowedExtensions.includes(extension)) {
    return response.status(400).json({ error: 'Invalid file type' });
  }

  const folderPath = folder && !Array.isArray(folder) ? `${folder}/` : '';
  const fullPath = `${folderPath}${filename}`;

  try {
    // Check if token exists
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return response.status(500).json({ error: 'Server configuration error: Missing BLOB_READ_WRITE_TOKEN' });
    }

    // Vercel Blob 'put' can handle the request stream directly if bodyParser is disabled
    const blob = await put(fullPath, request, {
      access: 'public',
    });

    return response.status(200).json(blob);
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return response.status(500).json({ error: `Upload failed: ${message}` });
  }
}

// Important: Disable body parsing to handle the stream directly with @vercel/blob
export const config = {
  api: {
    bodyParser: false,
  },
};
