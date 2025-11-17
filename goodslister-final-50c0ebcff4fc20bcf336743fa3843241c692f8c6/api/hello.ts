// This is a Vercel serverless function.
// Vercel will automatically detect this file in the /api directory
// and create a server endpoint for it.

// You can access it at `[your-deployment-url]/api/hello`

// Import the necessary types from Vercel's Node.js helper library.
import type { VercelRequest, VercelResponse } from '@vercel/node';

// The handler function receives a request and a response object.
export default function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set the status code to 200 (OK)
  res.status(200).json({ 
    message: 'Hello from the Goodslister API!' 
  });
}
