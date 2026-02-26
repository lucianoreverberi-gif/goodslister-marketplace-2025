import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email } = request.body;
  
  // Return a mock user object
  return response.status(200).json({
    id: `user-${Date.now()}`,
    name,
    email,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    bio: '',
    joinedDate: new Date().toISOString(),
    isVerified: false,
    favorites: []
  });
}
