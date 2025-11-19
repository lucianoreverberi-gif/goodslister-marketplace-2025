
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const status = {
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    postgres: !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL,
    ai: !!process.env.API_KEY,
  };

  return res.status(200).json(status);
}
