
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload } = req.body;

  try {
    switch (action) {
        case 'updateLogo':
            // Upsert logic for site config
            const logoExists = await sql`SELECT key FROM site_config WHERE key = 'logo_url'`;
            if (logoExists.rows.length > 0) {
                await sql`UPDATE site_config SET value = ${payload.url} WHERE key = 'logo_url'`;
            } else {
                await sql`INSERT INTO site_config (key, value) VALUES ('logo_url', ${payload.url})`;
            }
            return res.status(200).json({ success: true });

        case 'updateListingImage':
            // Postgres arrays are 1-indexed, but here we replace the whole array to be safe
            // First get existing images
            const listingResult = await sql`SELECT images FROM listings WHERE id = ${payload.listingId}`;
            if (listingResult.rows.length > 0) {
                const currentImages = listingResult.rows[0].images || [];
                const newImages = [payload.newImageUrl, ...currentImages.slice(1)];
                await sql`UPDATE listings SET images = ${newImages as any} WHERE id = ${payload.listingId}`;
            }
            return res.status(200).json({ success: true });

        case 'toggleFeatured':
             await sql`UPDATE listings SET is_featured = NOT is_featured WHERE id = ${payload.id}`;
             return res.status(200).json({ success: true });

        case 'updateSlide':
            await sql`
                UPDATE hero_slides 
                SET title=${payload.title}, subtitle=${payload.subtitle}, image_url=${payload.imageUrl}
                WHERE id=${payload.id}
            `;
            return res.status(200).json({ success: true });

        case 'addSlide':
             await sql`
                INSERT INTO hero_slides (id, title, subtitle, image_url)
                VALUES (${payload.id}, ${payload.title}, ${payload.subtitle}, ${payload.imageUrl})
            `;
            return res.status(200).json({ success: true });
        
        case 'deleteSlide':
            await sql`DELETE FROM hero_slides WHERE id=${payload.id}`;
            return res.status(200).json({ success: true });

        case 'updateBanner':
             await sql`
                UPDATE banners 
                SET title=${payload.title}, description=${payload.description}, button_text=${payload.buttonText}, image_url=${payload.imageUrl}
                WHERE id=${payload.id}
            `;
            return res.status(200).json({ success: true });

        case 'addBanner':
            await sql`
               INSERT INTO banners (id, title, description, button_text, image_url)
               VALUES (${payload.id}, ${payload.title}, ${payload.description}, ${payload.buttonText}, ${payload.imageUrl})
           `;
           return res.status(200).json({ success: true });

        case 'deleteBanner':
           await sql`DELETE FROM banners WHERE id=${payload.id}`;
           return res.status(200).json({ success: true });

        case 'updateCategoryImage':
            // Fetch current config map, update it, save it back
            const configRes = await sql`SELECT value FROM site_config WHERE key = 'category_images'`;
            let currentMap = {};
            if (configRes.rows.length > 0) {
                try { currentMap = JSON.parse(configRes.rows[0].value); } catch(e) {}
            }
            const newMap = { ...currentMap, [payload.category]: payload.url };
            
            if (configRes.rows.length > 0) {
                await sql`UPDATE site_config SET value = ${JSON.stringify(newMap)} WHERE key = 'category_images'`;
            } else {
                await sql`INSERT INTO site_config (key, value) VALUES ('category_images', ${JSON.stringify(newMap)})`;
            }
            return res.status(200).json({ success: true });

        case 'updateUserVerification':
             // Dynamic update based on type
             if (payload.type === 'email') await sql`UPDATE users SET is_email_verified = true WHERE id = ${payload.userId}`;
             if (payload.type === 'phone') await sql`UPDATE users SET is_phone_verified = true WHERE id = ${payload.userId}`;
             if (payload.type === 'id') await sql`UPDATE users SET is_id_verified = true WHERE id = ${payload.userId}`;
             return res.status(200).json({ success: true });

        case 'updateUserAvatar':
            await sql`UPDATE users SET avatar_url = ${payload.url} WHERE id = ${payload.userId}`;
            return res.status(200).json({ success: true });
        
        default:
            return res.status(400).json({ error: 'Unknown action' });
    }

  } catch (error) {
    console.error("Admin action error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Database error" });
  }
}
