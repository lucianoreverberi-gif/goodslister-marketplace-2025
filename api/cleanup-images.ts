
import { del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { urls } = request.body;

  if (!urls || !Array.isArray(urls)) {
    return response.status(400).json({ error: 'URLs array is required' });
  }

  try {
    // Delete the blobs from Vercel storage
    await del(urls);
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting blobs from Vercel Blob:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return response.status(500).json({ error: `Deletion failed: ${message}` });
  }
}
