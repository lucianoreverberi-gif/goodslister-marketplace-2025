
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set cache control to ensure data is fresh but fast
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  // Default category images fallback (inlined to avoid import errors)
  const defaultCategoryImages = {
    "Motorcycles": 'https://images.unsplash.com/photo-1625043484555-5654b594199c?q=80&w=1974&auto=format&fit=crop',
    "Bikes": 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=2070&auto=format&fit=crop',
    "Boats": 'https://images.unsplash.com/photo-1593853992454-0371391a03a8?q=80&w=2070&auto=format&fit=crop',
    "Camping": 'https://images.unsplash.com/photo-1537565266759-34f2b345716d?q=80&w=1974&auto=format&fit=crop',
    "Winter Sports": 'https://images.unsplash.com/photo-1551690628-99de0e94411e?q=80&w=1974&auto=format&fit=crop',
    "Water Sports": 'https://images.unsplash.com/photo-1570533158623-3a5101657c98?q=80&w=2070&auto=format&fit=crop',
    "RVs": 'https://images.unsplash.com/photo-1558223533-4c5c7f186358?q=80&w=2070&auto=format&fit=crop',
    "UTVs": 'https://images.unsplash.com/photo-1634567292109-768a4b37f2c9?q=80&w=1974&auto=format&fit=crop',
  };

  try {
    // 1. Fetch Content & Config
    const logoQuery = await sql`SELECT value FROM site_config WHERE key = 'logo_url'`;
    const slidesQuery = await sql`SELECT * FROM hero_slides`;
    const bannersQuery = await sql`SELECT * FROM banners`;
    const categoryImagesQuery = await sql`SELECT value FROM site_config WHERE key = 'category_images'`;

    // 2. Fetch Users
    const usersQuery = await sql`SELECT * FROM users`;

    // 3. Fetch Listings
    const listingsQuery = await sql`SELECT * FROM listings`;

    // 4. Fetch Bookings
    const bookingsQuery = await sql`SELECT * FROM bookings`;

    // --- Process Data ---

    const users = usersQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      registeredDate: row.registered_date ? new Date(row.registered_date).toISOString().split('T')[0] : '',
      avatarUrl: row.avatar_url,
      isEmailVerified: row.is_email_verified,
      isPhoneVerified: row.is_phone_verified,
      isIdVerified: row.is_id_verified,
      averageRating: Number(row.average_rating),
      totalReviews: row.total_reviews
    }));

    const listings = listingsQuery.rows.map(row => {
      const owner = users.find(u => u.id === row.owner_id);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
        pricePerDay: Number(row.price_per_day),
        pricePerHour: Number(row.price_per_hour),
        pricingType: row.pricing_type,
        location: {
          city: row.location_city,
          state: row.location_state,
          country: row.location_country,
          latitude: Number(row.location_lat),
          longitude: Number(row.location_lng)
        },
        owner: owner || (users.length > 0 ? users[0] : { id: 'deleted', name: 'Unknown', avatarUrl: '' }),
        images: row.images || [],
        videoUrl: row.video_url,
        isFeatured: row.is_featured,
        rating: Number(row.rating),
        reviewsCount: row.reviews_count,
        bookedDates: row.booked_dates || [],
        ownerRules: row.owner_rules
      };
    });

    const bookings = bookingsQuery.rows.map(row => {
        const listing = listings.find(l => l.id === row.listing_id);
        return {
            id: row.id,
            listingId: row.listing_id,
            listing: listing, 
            renterId: row.renter_id,
            startDate: row.start_date,
            endDate: row.end_date,
            totalPrice: Number(row.total_price),
            status: row.status
        }
    }).filter(b => b.listing); 

    const logoUrl = logoQuery.rows.length > 0 ? logoQuery.rows[0].value : '';
    
    const heroSlides = slidesQuery.rows.map(row => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        imageUrl: row.image_url
    }));

    const banners = bannersQuery.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        buttonText: row.button_text,
        imageUrl: row.image_url,
        layout: row.layout || 'overlay',
        linkUrl: row.link_url || ''
    }));

    let categoryImages = defaultCategoryImages;
    if (categoryImagesQuery.rows.length > 0) {
        try {
            const dbImages = JSON.parse(categoryImagesQuery.rows[0].value);
            // FIX: Merge DB images with defaults so we don't lose categories that haven't been customized yet
            categoryImages = { ...defaultCategoryImages, ...dbImages };
        } catch (e) {
            // Keep defaults if parse fails
        }
    }

    // Construct final object
    const appData = {
        users,
        listings,
        bookings,
        logoUrl,
        heroSlides,
        banners,
        categoryImages,
        conversations: [], 
        paymentApiKey: 'pk_live_placeholder'
    };

    return res.status(200).json(appData);

  } catch (error) {
    console.error("Failed to fetch app data:", error);
    // Return 500 but with JSON to be handled gracefully
    return res.status(500).json({ error: "Failed to fetch application data from database." });
  }
}
