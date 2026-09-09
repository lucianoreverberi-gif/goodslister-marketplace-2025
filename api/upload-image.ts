import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import exifr from 'exifr';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 3-tier verification thresholds (calibrable via env vars)
const MAX_DISTANCE_M = Number(process.env.PHOTO_MAX_DISTANCE_M) || 2000; // 2km
const MAX_TIME_DIFF_MINUTES = Number(process.env.PHOTO_MAX_TIME_DIFF_MIN) || 60; // 1 hour

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  const { filename, folder, bookingId, photoType, angleId, angleLabel, verify } = request.query;
  if (!filename || Array.isArray(filename)) return response.status(400).json({ error: 'Filename is required' });

  const folderPath = folder && !Array.isArray(folder) ? `${folder}/` : '';
  const fullPath = `${folderPath}${filename}`;

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return response.status(500).json({ error: 'Server configuration error: Missing BLOB_READ_WRITE_TOKEN' });
    }

    // Buffer the stream so we can both extract EXIF and upload
    const buffer = await streamToBuffer(request);

    // 3-tier verification (only if verify=true and bookingId provided)
    let verificationTier: 'VERIFIED' | 'PARTIAL' | 'REJECTED' = 'PARTIAL';
    let verificationFlags: string[] = [];
    let exifData: any = null;
    let distanceM: number | null = null;
    let timeDiffMin: number | null = null;

    if (verify === 'true' && bookingId && !Array.isArray(bookingId)) {
      try {
        exifData = await exifr.parse(buffer, { gps: true }).catch(() => null);

        if (!exifData) {
          verificationFlags.push('NO_EXIF');
        } else {
          // Check for editing software (Photoshop, GIMP, etc.)
          const softwareLower = (exifData.Software || '').toLowerCase();
          if (softwareLower.includes('photoshop') || softwareLower.includes('gimp') || softwareLower.includes('lightroom')) {
            verificationFlags.push('EDITED_BY_SOFTWARE');
            verificationTier = 'REJECTED';
          }

          // Time check
          if (exifData.DateTimeOriginal) {
            const takenAt = new Date(exifData.DateTimeOriginal);
            timeDiffMin = Math.round((Date.now() - takenAt.getTime()) / 60000);
            if (timeDiffMin > MAX_TIME_DIFF_MINUTES || timeDiffMin < -5) {
              verificationFlags.push('TIMESTAMP_OUT_OF_RANGE');
              verificationTier = 'REJECTED';
            }
          } else {
            verificationFlags.push('NO_TIMESTAMP');
          }

          // GPS check against listing location
          if (exifData.latitude != null && exifData.longitude != null) {
            try {
              const listingQ = await sql`
                SELECT l.location_lat, l.location_lng FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE b.id = ${bookingId} LIMIT 1
              `;
              if (listingQ.rows.length > 0) {
                const lat = Number(listingQ.rows[0].location_lat);
                const lng = Number(listingQ.rows[0].location_lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                  distanceM = haversineDistance(exifData.latitude, exifData.longitude, lat, lng);
                  if (distanceM > MAX_DISTANCE_M) {
                    verificationFlags.push('GPS_TOO_FAR');
                    verificationTier = 'REJECTED';
                  }
                }
              }
            } catch (dbErr) {
              console.warn('Listing location check failed:', dbErr);
            }
          } else {
            verificationFlags.push('NO_GPS');
          }
        }

        // Compute tier if not REJECTED
        if (verificationTier !== 'REJECTED') {
          const hasBlockers = verificationFlags.some(f => ['NO_EXIF','NO_GPS','NO_TIMESTAMP'].includes(f));
          verificationTier = hasBlockers ? 'PARTIAL' : 'VERIFIED';
        }

        // If REJECTED, return 400 with clear message BEFORE uploading
        if (verificationTier === 'REJECTED') {
          const primaryFlag = verificationFlags[0];
          const messages: Record<string, string> = {
            EDITED_BY_SOFTWARE: 'Esta foto parece haber sido editada. Tomá una foto directamente con tu cámara.',
            TIMESTAMP_OUT_OF_RANGE: `Esta foto fue tomada hace ${timeDiffMin} minutos. Por seguridad, tomá una foto ahora mismo.`,
            GPS_TOO_FAR: `Esta foto fue tomada a ${(distanceM! / 1000).toFixed(1)}km del punto de encuentro. Verificá tu ubicación.`,
          };
          return response.status(400).json({
            error: 'PHOTO_VERIFICATION_FAILED',
            tier: 'REJECTED',
            flags: verificationFlags,
            userMessage: messages[primaryFlag] || 'Esta foto no pasó las verificaciones de seguridad. Tomá una nueva.',
          });
        }
      } catch (exifErr) {
        console.warn('EXIF extraction failed:', exifErr);
        verificationFlags.push('EXIF_PARSE_ERROR');
      }
    }

    // Upload to Vercel Blob (no addRandomSuffix - we want duplicate rejection)
    const blob = await put(fullPath, buffer, { access: 'public' });

    // If verification enabled, persist metadata
    if (verify === 'true' && bookingId && !Array.isArray(bookingId)) {
      try {
        const photoId = 'insp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        await sql`
          INSERT INTO inspection_photos (
            id, booking_id, photo_url, photo_type, angle_id, angle_label,
            taken_at, gps_lat, gps_lng, device_model, software, has_exif,
            verification_tier, verification_flags, distance_from_pickup_m, time_diff_minutes
          ) VALUES (
            ${photoId}, ${bookingId}, ${blob.url}, ${(photoType as string) || 'handover'},
            ${(angleId as string) || null}, ${(angleLabel as string) || null},
            ${exifData?.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toISOString() : null},
            ${exifData?.latitude ?? null}, ${exifData?.longitude ?? null},
            ${exifData?.Model || null}, ${exifData?.Software || null},
            ${!!exifData}, ${verificationTier}, ${verificationFlags as any}, ${distanceM}, ${timeDiffMin}
          )
        `;
      } catch (dbErr) {
        console.warn('Failed to persist inspection photo metadata:', dbErr);
      }
    }

    return response.status(200).json({ ...blob, verificationTier, verificationFlags });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.toLowerCase().includes('blob already exists')) {
      return response.status(409).json({
        error: 'DUPLICATE_PHOTO',
        message: 'This photo has already been used.',
        userMessage: 'Foto rechazada: esta imagen ya fue utilizada. Por seguridad, tomá una foto nueva del estado actual.'
      });
    }
    return response.status(500).json({ error: `Upload failed: ${message}` });
  }
}

export const config = { api: { bodyParser: false } };
