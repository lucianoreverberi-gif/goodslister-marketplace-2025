import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const blob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const postgres = !!process.env.POSTGRES_URL;
  const ai = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  return res.status(200).json({ blob, postgres, ai });
}
