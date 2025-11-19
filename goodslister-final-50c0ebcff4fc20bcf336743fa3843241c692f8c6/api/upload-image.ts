import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'node:buffer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const filename = (req.query.filename as string) || 'image.png';

  try {
    // 1. Read the request body into a buffer first.
    // This ensures we have the full file data available in memory.
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // 2. Try uploading to Vercel Blob if the token is configured.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const blob = await put(filename, buffer, {
                access: 'public',
                addRandomSuffix: true, // FIX: Prevents "Blob already exists" error by making filenames unique
            });
            return res.status(200).json({ url: blob.url });
        } catch (blobError) {
            console.warn('Vercel Blob upload failed, falling back to Base64.', blobError);
            // Proceed to fallback if Blob upload fails
        }
    } else {
        console.warn('BLOB_READ_WRITE_TOKEN not found, falling back to Base64.');
    }

    // 3. Fallback: Return Base64 Data URI.
    // This guarantees the frontend receives a valid image URL even without external storage configuration.
    const base64 = buffer.toString('base64');
    const ext = filename.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png'; // Default
    if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    
    const dataUri = `data:${mimeType};base64,${base64}`;

    return res.status(200).json({ url: dataUri });

  } catch (error) {
    console.error('Upload handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    return res.status(500).json({ error: `Upload failed: ${errorMessage}` });
  }
}