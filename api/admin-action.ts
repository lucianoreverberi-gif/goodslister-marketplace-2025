import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // For now, we just return success to allow the UI to proceed.
  // In a real app, this would update a database (e.g. Vercel Postgres).
  console.log('Admin action received:', request.body);

  return response.status(200).json({ success: true, message: 'Action processed (mock)' });
}
