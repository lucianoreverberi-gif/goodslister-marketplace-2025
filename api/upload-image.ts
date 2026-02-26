import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { filename } = request.query;

  if (!filename || Array.isArray(filename)) {
    return response.status(400).json({ error: 'Filename is required' });
  }

  try {
    // Vercel Node.js functions provide the body as a stream or buffer depending on config
    // For large files, we might need to handle the stream
    const blob = await put(filename, request, {
      access: 'public',
    });

    return response.status(200).json(blob);
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return response.status(500).json({ error: 'Error uploading image' });
  }
}

// Important: Disable body parsing to handle the stream directly with @vercel/blob
export const config = {
  api: {
    bodyParser: false,
  },
};
