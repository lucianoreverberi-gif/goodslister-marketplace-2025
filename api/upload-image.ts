import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const filename = (req.query.filename as string) || 'image.png';

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      return res.status(200).json({ url: blob.url });
    }

    // Fallback base64 para desarrollo local si no hay token
    const base64 = buffer.toString('base64');
    return res.status(200).json({ url: `data:image/png;base64,${base64}` });

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}