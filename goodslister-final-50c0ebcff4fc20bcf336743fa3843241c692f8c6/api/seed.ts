
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- INLINED MOCK DATA FOR SEEDING ---
// This prevents "module not found" errors when importing from ../constants
const mockUsers = [
    {
        id: 'user-1',
        name: 'Carlos Gomez',
        email: 'carlos.gomez@example.com',
        registeredDate: '2023-01-15',
        avatarUrl: 'https://i.pravatar.cc/150?u=user-1',
        isEmailVerified: true,
        isPhoneVerified: false,
        isIdVerified: false,
        averageRating: 4.8,
        totalReviews: 12,
    },
    {
        id: 'user-2',
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@example.com',
        registeredDate: '2023-02-20',
        avatarUrl: 'https://i.pravatar.cc/150?u=user-2',
        isEmailVerified: true,
        isPhoneVerified: true,
        isIdVerified: true,
        averageRating: 4.9,
        totalReviews: 21,
    },
    {
        id: 'user-3',
        name: 'Luciano Reverberi',
        email: 'lucianoreverberi@gmail.com',
        registeredDate: '2023-01-01',
        avatarUrl: 'https://i.pravatar.cc/150?u=lucianoreverberi',
        isEmailVerified: true,
        isPhoneVerified: true,
        isIdVerified: false,
        averageRating: 5.0,
        totalReviews: 2,
    },
];

const mockListings = [
    {
        id: 'listing-1',
        title: 'Adventure Double Kayak',
        description: 'Perfect for exploring lakes and rivers. Stable and safe, ideal for two people. Includes paddles and life vests. Available for weekends.',
        category: "Water Sports",
        subcategory: 'Kayak',
        pricingType: 'daily',
        pricePerDay: 50,
        location: { city: 'Bariloche', state: 'Río Negro', country: 'Argentina', latitude: -41.1335, longitude: -71.3103 },
        owner: mockUsers[0],
        images: ['https://images.pexels.com/photos/1687574/pexels-photo-1687574.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'https://images.pexels.com/photos/2324168/pexels-photo-2324168.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
        videoUrl: 'https://www.youtube.com/watch?v=1_pA6MvT_fA',
        isFeatured: true,
        rating: 4.8,
        reviewsCount: 25,
        bookedDates: ['2025-11-10', '2025-11-11', '2025-11-12', '2025-11-20', '2025-11-21', '2025-11-22', '2025-11-23'],
        ownerRules: "1. Must be returned clean, otherwise a $20 cleaning fee will apply.\n2. Renter is responsible for any damage to the kayak or equipment.\n3. For use in freshwater lakes and rivers only. Not for ocean use.",
    },
    {
        id: 'listing-2',
        title: 'Scott Spark Mountain Bike',
        description: 'High-end mountain bike, perfect for trails and difficult terrain. Full suspension and hydraulic disc brakes for maximum safety.',
        category: "Bikes",
        subcategory: 'Mountain',
        pricingType: 'daily',
        pricePerDay: 60,
        location: { city: 'Mendoza', state: 'Mendoza', country: 'Argentina', latitude: -32.8895, longitude: -68.8458 },
        owner: mockUsers[1],
        images: ['https://images.pexels.com/photos/2559333/pexels-photo-2559333.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
        isFeatured: true,
        rating: 4.9,
        reviewsCount: 18,
    },
    {
        id: 'listing-3',
        title: 'Burton Pro Snowboard',
        description: 'Experience the mountain with this professional snowboard. Ideal for intermediate to advanced riders looking for performance and style.',
        category: "Winter Sports",
        subcategory: 'Snowboard',
        pricingType: 'daily',
        pricePerDay: 75,
        location: { city: 'Ushuaia', state: 'Tierra del Fuego', country: 'Argentina', latitude: -54.8019, longitude: -68.3030 },
        owner: mockUsers[0],
        images: ['https://images.pexels.com/photos/1633433/pexels-photo-1633433.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
        isFeatured: true,
        rating: 4.9,
        reviewsCount: 31,
        bookedDates: ['2024-09-05', '2024-09-06', '2024-09-07'],
        ownerRules: "Only for use on designated ski resort trails. Renter assumes all risk of injury. Any damage to the board will be charged at repair cost.",
    },
    {
        id: 'listing-4',
        title: 'RV for 4 People',
        description: 'Travel the country with total freedom. This RV is fully equipped with a kitchen, bathroom, and comfortable beds for a family or group of friends.',
        category: "RVs",
        subcategory: 'Campervan',
        pricingType: 'daily',
        pricePerDay: 150,
        location: { city: 'Córdoba', state: 'Córdoba', country: 'Argentina', latitude: -31.4201, longitude: -64.1888 },
        owner: mockUsers[1],
        images: ['https://images.unsplash.com/photo-1527786356413-1650a3a7a093?q=80&w=2070&auto=format&fit=crop'],
        isFeatured: false,
        rating: 4.7,
        reviewsCount: 22,
    },
     {
        id: 'listing-5',
        title: 'Complete Kitesurfing Kit',
        description: 'Feel the adrenaline with this latest generation kitesurfing equipment. Includes kite, board, and harness. Ideal for strong winds.',
        category: "Water Sports",
        subcategory: 'Kitesurf',
        pricingType: 'hourly',
        pricePerHour: 25,
        location: { city: 'Mar del Plata', state: 'Buenos Aires', country: 'Argentina', latitude: -38.0055, longitude: -57.5426 },
        owner: mockUsers[0],
        images: ['https://images.pexels.com/photos/3927233/pexels-photo-3927233.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
        isFeatured: true,
        rating: 4.8,
        reviewsCount: 15,
    },
    {
        id: 'listing-6',
        title: 'High-Speed Jet Ski Rental',
        description: 'Explore the beautiful waters of Miami on this powerful and fun jet ski. Perfect for an adrenaline-filled day. Life vests included.',
        category: "Water Sports",
        subcategory: 'Jet Ski',
        pricingType: 'hourly',
        pricePerHour: 120,
        location: { city: 'Miami', state: 'Florida', country: 'USA', latitude: 25.7617, longitude: -80.1918 },
        owner: mockUsers[0],
        images: ['https://images.pexels.com/photos/1680246/pexels-photo-1680246.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
        isFeatured: true,
        rating: 4.9,
        reviewsCount: 35,
    },
    {
        id: 'listing-7',
        title: 'Luxury Yacht for Day Trips',
        description: 'Charter this beautiful yacht for a day of luxury on the water. Perfect for groups up to 10. Includes a captain and crew.',
        category: "Boats",
        subcategory: 'Yacht',
        pricingType: 'daily',
        pricePerDay: 2500,
        location: { city: 'Miami Beach', state: 'Florida', country: 'USA', latitude: 25.7907, longitude: -80.1300 },
        owner: mockUsers[1],
        images: ['https://images.unsplash.com/photo-1598852688832-d1a1d130386a?q=80&w=2070&auto=format&fit=crop'],
        isFeatured: false,
        rating: 5.0,
        reviewsCount: 12,
    },
    {
        id: 'listing-8',
        title: 'Stand Up Paddleboard',
        description: 'Enjoy a relaxing day on the water with this stable and easy-to-use stand up paddleboard. Great for beginners and experts alike.',
        category: "Water Sports",
        subcategory: 'Paddleboard',
        pricingType: 'hourly',
        pricePerHour: 35,
        location: { city: 'Pembroke Pines', state: 'Florida', country: 'USA', latitude: 26.0098, longitude: -80.3259 },
        owner: mockUsers[1],
        images: ['https://images.unsplash.com/photo-1599389816911-2795f2de0e94?q=80&w=2070&auto=format&fit=crop'],
        isFeatured: false,
        rating: 4.7,
        reviewsCount: 19,
    },
];

const initialHeroSlides = [
    {
        id: 'slide-1',
        title: 'Rent what you need, when you need it.',
        subtitle: 'Explore thousands of items from trusted owners near you. From adventure gear to tools for your next project.',
        imageUrl: 'https://images.unsplash.com/photo-1529251848243-c5a5b58c566a?q=80&w=2070&auto=format&fit=crop',
    },
];

const initialBanners = [
    {
        id: 'banner-1',
        title: 'Earn extra money with your items',
        description: 'Do you have gear you don\'t use? List it on Goodslister and start generating passive income. It\'s easy, safe, and free.',
        buttonText: 'List your item now',
        imageUrl: 'https://images.unsplash.com/photo-1627922446305-5386f188cedc?q=80&w=2070&auto=format&fit=crop',
        layout: 'overlay',
        linkUrl: '/createListing'
    },
];


export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // 1. Create Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        registered_date DATE,
        avatar_url TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_phone_verified BOOLEAN DEFAULT FALSE,
        is_id_verified BOOLEAN DEFAULT FALSE,
        average_rating NUMERIC(3, 2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0
      );
    `;

    // 2. Create Listings Table
    await sql`
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        subcategory VARCHAR(50),
        price_per_day NUMERIC(10, 2),
        price_per_hour NUMERIC(10, 2),
        pricing_type VARCHAR(20),
        location_city VARCHAR(100),
        location_state VARCHAR(100),
        location_country VARCHAR(100),
        location_lat NUMERIC,
        location_lng NUMERIC,
        owner_id VARCHAR(255) REFERENCES users(id),
        images TEXT[], 
        video_url TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        rating NUMERIC(3, 2) DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        booked_dates TEXT[],
        owner_rules TEXT
      );
    `;

    // 3. Create Bookings Table
    await sql`
        CREATE TABLE IF NOT EXISTS bookings (
            id VARCHAR(255) PRIMARY KEY,
            listing_id VARCHAR(255) REFERENCES listings(id),
            renter_id VARCHAR(255) REFERENCES users(id),
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            total_price NUMERIC(10, 2),
            status VARCHAR(20),
            insurance_plan VARCHAR(50),
            payment_method VARCHAR(50)
        );
    `;

    // 4. Create Payments Table (New for Organization)
    await sql`
        CREATE TABLE IF NOT EXISTS payments (
            id VARCHAR(255) PRIMARY KEY,
            booking_id VARCHAR(255) REFERENCES bookings(id),
            payer_id VARCHAR(255) REFERENCES users(id),
            payee_id VARCHAR(255) REFERENCES users(id),
            amount NUMERIC(10, 2),
            platform_fee NUMERIC(10, 2),
            owner_payout NUMERIC(10, 2),
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // 5. Create Content Tables (Hero Slides, Banners, Config)
    await sql`
        CREATE TABLE IF NOT EXISTS hero_slides (
            id VARCHAR(255) PRIMARY KEY,
            title TEXT,
            subtitle TEXT,
            image_url TEXT
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS banners (
            id VARCHAR(255) PRIMARY KEY,
            title TEXT,
            description TEXT,
            button_text TEXT,
            image_url TEXT,
            layout TEXT DEFAULT 'overlay',
            link_url TEXT
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS inspections (
            id VARCHAR(255) PRIMARY KEY,
            booking_id VARCHAR(255) REFERENCES bookings(id),
            image_url TEXT,
            status VARCHAR(50),
            ai_analysis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS site_config (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT
        );
    `;


    // --- SEED DATA INSERTION ---

    // Users
    const { rows: userRows } = await sql`SELECT count(*) FROM users`;
    if (parseInt(userRows[0].count) === 0) {
        for (const user of mockUsers) {
            await sql`
                INSERT INTO users (id, name, email, registered_date, avatar_url, is_email_verified, is_phone_verified, is_id_verified, average_rating, total_reviews)
                VALUES (${user.id}, ${user.name}, ${user.email}, ${user.registeredDate}, ${user.avatarUrl}, ${user.isEmailVerified}, ${user.isPhoneVerified}, ${user.isIdVerified}, ${user.averageRating}, ${user.totalReviews})
            `;
        }
        console.log('Users inserted');
    }

    // Listings
    const { rows: listingRows } = await sql`SELECT count(*) FROM listings`;
    if (parseInt(listingRows[0].count) === 0) {
        for (const listing of mockListings) {
            await sql`
                INSERT INTO listings (
                    id, title, description, category, subcategory, 
                    price_per_day, price_per_hour, pricing_type, 
                    location_city, location_state, location_country, location_lat, location_lng,
                    owner_id, images, video_url, is_featured, rating, reviews_count, booked_dates, owner_rules
                )
                VALUES (
                    ${listing.id}, ${listing.title}, ${listing.description}, ${listing.category}, ${listing.subcategory},
                    ${listing.pricePerDay || 0}, ${listing.pricePerHour || 0}, ${listing.pricingType},
                    ${listing.location.city}, ${listing.location.state}, ${listing.location.country}, ${listing.location.latitude}, ${listing.location.longitude},
                    ${listing.owner.id}, ${listing.images as any}, ${listing.videoUrl || ''}, ${listing.isFeatured}, ${listing.rating}, ${listing.reviewsCount}, ${listing.bookedDates as any}, ${listing.ownerRules || ''}
                )
            `;
        }
        console.log('Listings inserted');
    }

    // Hero Slides
    const { rows: slidesRows } = await sql`SELECT count(*) FROM hero_slides`;
    if (parseInt(slidesRows[0].count) === 0) {
        for (const slide of initialHeroSlides) {
            await sql`
                INSERT INTO hero_slides (id, title, subtitle, image_url)
                VALUES (${slide.id}, ${slide.title}, ${slide.subtitle}, ${slide.imageUrl})
            `;
        }
        console.log('Hero slides inserted');
    }

    // Banners
    const { rows: bannerRows } = await sql`SELECT count(*) FROM banners`;
    if (parseInt(bannerRows[0].count) === 0) {
        for (const banner of initialBanners) {
            await sql`
                INSERT INTO banners (id, title, description, button_text, image_url, layout, link_url)
                VALUES (${banner.id}, ${banner.title}, ${banner.description}, ${banner.buttonText}, ${banner.imageUrl}, ${banner.layout || 'overlay'}, ${banner.linkUrl || ''})
            `;
        }
        console.log('Banners inserted');
    } else {
        // Run a migration for existing tables to add the columns if missing (simple check)
        try {
            await sql`ALTER TABLE banners ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'overlay'`;
            await sql`ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url TEXT`;
        } catch(e) {
            console.log("Column migration skipped or failed", e);
        }
    }

    // Site Config (Logo)
    const { rows: configRows } = await sql`SELECT count(*) FROM site_config WHERE key = 'logo_url'`;
    if (parseInt(configRows[0].count) === 0) {
        await sql`
            INSERT INTO site_config (key, value)
            VALUES ('logo_url', 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png')
        `;
        console.log('Logo config inserted');
    }


    return res.status(200).json({ message: 'Database seeded successfully', details: 'All tables (users, listings, bookings, payments, content) created and data inserted.' });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
