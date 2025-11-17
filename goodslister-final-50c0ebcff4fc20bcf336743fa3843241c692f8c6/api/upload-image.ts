import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// By removing the `export const config = { runtime: 'edge' }`,
// this function now defaults to a standard Node.js Serverless Function,
// which has broader compatibility and will resolve the build error.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filename = req.query.filename as string;

    if (!filename) {
      return res.status(400).json({ error: 'Filename must be provided as a query parameter.' });
    }

    // The VercelRequest object itself is a readable stream of the request body.
    // This can be passed directly to the `put` function.
    const blob = await put(filename, req, {
      access: 'public',
    });

    return res.status(200).json({ url: blob.url });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    return res.status(500).json({ error: `Upload failed: ${errorMessage}` });
  }
}
