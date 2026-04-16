import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, folder } = request.query;

  if (!filename || Array.isArray(filename)) {
    return response.status(400).json({ error: 'Filename is required' });
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
