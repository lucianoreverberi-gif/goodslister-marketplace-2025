import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = request.body;
    console.log('Admin action received:', action, payload);

    switch (action) {
      case 'updateUserProfile':
        await sql`
          UPDATE users 
          SET name = ${payload.name}, bio = ${payload.bio}, avatar_url = ${payload.avatarUrl}
          WHERE id = ${payload.userId}
        `;
        break;

      case 'updateUserVerification':
        if (payload.type === 'email') {
          await sql`UPDATE users SET is_email_verified = true WHERE id = ${payload.userId}`;
        } else if (payload.type === 'phone') {
          await sql`UPDATE users SET is_phone_verified = true WHERE id = ${payload.userId}`;
        } else if (payload.type === 'id') {
          await sql`UPDATE users SET is_id_verified = true WHERE id = ${payload.userId}`;
        }
        break;

      case 'updateUserAvatar':
        await sql`UPDATE users SET avatar_url = ${payload.url} WHERE id = ${payload.userId}`;
        break;

      case 'updateLogo':
        await sql`UPDATE site_config SET value = ${payload.url} WHERE key = 'logo_url'`;
        break;

      case 'updateSlide':
        await sql`
          UPDATE hero_slides 
          SET title = ${payload.title}, subtitle = ${payload.subtitle}, image_url = ${payload.imageUrl}
          WHERE id = ${payload.id}
        `;
        break;

      case 'addSlide':
        await sql`
          INSERT INTO hero_slides (id, title, subtitle, image_url)
          VALUES (${payload.id}, ${payload.title}, ${payload.subtitle}, ${payload.imageUrl})
        `;
        break;

      case 'deleteSlide':
        await sql`DELETE FROM hero_slides WHERE id = ${payload.id}`;
        break;

      case 'updateBanner':
        await sql`
          UPDATE banners 
          SET title = ${payload.title}, description = ${payload.description}, 
              button_text = ${payload.buttonText}, image_url = ${payload.imageUrl},
              layout = ${payload.layout}, link_url = ${payload.linkUrl}
          WHERE id = ${payload.id}
        `;
        break;

      case 'addBanner':
        await sql`
          INSERT INTO banners (id, title, description, button_text, image_url, layout, link_url)
          VALUES (${payload.id}, ${payload.title}, ${payload.description}, ${payload.buttonText}, ${payload.imageUrl}, ${payload.layout}, ${payload.linkUrl})
        `;
        break;

      case 'deleteBanner':
        await sql`DELETE FROM banners WHERE id = ${payload.id}`;
        break;

      case 'toggleFeatured':
        await sql`UPDATE listings SET is_featured = NOT is_featured WHERE id = ${payload.id}`;
        break;

      case 'updateCategoryImage':
        // Handle JSON storage for category images mapping
        const currentConfig = await sql`SELECT value FROM site_config WHERE key = 'category_images'`;
        let config = {};
        if (currentConfig.rows.length > 0) {
          config = JSON.parse(currentConfig.rows[0].value);
        }
        config[payload.category] = payload.url;
        await sql`
          INSERT INTO site_config (key, value) 
          VALUES ('category_images', ${JSON.stringify(config)})
          ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(config)}
        `;
        break;

      case 'updateListingImage':
        // Assuming images are stored as array of strings
        await sql`UPDATE listings SET images = ${[payload.newImageUrl] as any} WHERE id = ${payload.listingId}`;
        break;
      
      case 'updateDepositStatus':
        await sql`UPDATE bookings SET deposit_status = ${payload.status} WHERE id = ${payload.bookingId}`;
        break;

      default:
        console.warn('Unknown admin action:', action);
        return response.status(400).json({ error: 'Unknown action' });
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing admin action:', error);
    return response.status(500).json({ error: 'Failed to process action in database.' });
  }
}
