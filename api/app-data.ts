import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Return empty arrays/objects so the frontend falls back to mock data correctly
  return response.status(200).json({
    users: [],
    listings: [],
    heroSlides: [],
    banners: [],
    categoryImages: null,
    logoUrl: '',
    paymentApiKey: '',
    bookings: []
  });
}
