
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mockUsers, mockListings, mockBookings } from '../constants';

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
        license_verified BOOLEAN DEFAULT FALSE,
        average_rating NUMERIC(3, 2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0
      );
    `;

    // 2. Create Listings Table
    // Note: We store complex objects like 'location' and 'images' as JSONB or simple TEXT arrays for simplicity in this MVP.
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
        owner_rules TEXT,
        has_gps_tracker BOOLEAN DEFAULT FALSE
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
            protection_type VARCHAR(20),
            protection_fee NUMERIC(10, 2),
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
            protection_fee NUMERIC(10, 2),
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

    // Run migrations for existing columns if needed
    try {
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_gps_tracker BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS protection_type VARCHAR(20)`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS protection_fee NUMERIC(10, 2)`;
    } catch (e) {
        console.log("Migration skipped", e);
    }

    // 4. Insert Mock Users (Only if table is empty to avoid duplicates on re-runs)
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

    // 5. Insert Mock Listings
    const { rows: listingRows } = await sql`SELECT count(*) FROM listings`;
    if (parseInt(listingRows[0].count) === 0) {
        for (const listing of mockListings) {
            await sql`
                INSERT INTO listings (
                    id, title, description, category, subcategory, 
                    price_per_day, price_per_hour, pricing_type, 
                    location_city, location_state, location_country, location_lat, location_lng,
                    owner_id, images, video_url, is_featured, rating, reviews_count, booked_dates, owner_rules, has_gps_tracker
                )
                VALUES (
                    ${listing.id}, ${listing.title}, ${listing.description}, ${listing.category}, ${listing.subcategory},
                    ${listing.pricePerDay || 0}, ${listing.pricePerHour || 0}, ${listing.pricingType},
                    ${listing.location.city}, ${listing.location.state}, ${listing.location.country}, ${listing.location.latitude}, ${listing.location.longitude},
                    ${listing.owner.id}, ${listing.images as any}, ${listing.videoUrl || ''}, ${listing.isFeatured}, ${listing.rating}, ${listing.reviewsCount}, ${listing.bookedDates as any}, ${listing.ownerRules || ''}, ${false}
                )
            `;
        }
        console.log('Listings inserted');
    }

    return res.status(200).json({ message: 'Database seeded successfully', details: 'Tables created and initial data inserted.' });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
