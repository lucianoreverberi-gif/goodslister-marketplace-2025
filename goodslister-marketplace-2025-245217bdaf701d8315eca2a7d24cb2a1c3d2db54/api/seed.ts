
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
        total_reviews INTEGER DEFAULT 0,
        favorites TEXT[] DEFAULT ARRAY[]::TEXT[]
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
        owner_rules TEXT,
        has_gps_tracker BOOLEAN DEFAULT FALSE,
        has_commercial_insurance BOOLEAN DEFAULT FALSE,
        security_deposit NUMERIC(10, 2) DEFAULT 0,
        listing_type VARCHAR(20) DEFAULT 'rental',
        operator_license_id TEXT,
        fuel_policy VARCHAR(20),
        skill_level VARCHAR(20),
        whats_included TEXT,
        itinerary TEXT,
        price_unit VARCHAR(20) DEFAULT 'item'
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
            amount_paid_online NUMERIC(10, 2) DEFAULT 0,
            balance_due_on_site NUMERIC(10, 2) DEFAULT 0,
            status VARCHAR(20),
            protection_type VARCHAR(20),
            protection_fee NUMERIC(10, 2),
            payment_method VARCHAR(50),
            has_handover_inspection BOOLEAN DEFAULT FALSE,
            has_return_inspection BOOLEAN DEFAULT FALSE
        );
    `;

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
        CREATE TABLE IF NOT EXISTS site_config (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT
        );
    `;

    // Initialize Default Config (Logo and Categories)
    await sql`
        INSERT INTO site_config (key, value) 
        VALUES ('logo_url', 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png')
        ON CONFLICT (key) DO NOTHING;
    `;

    // Seeding Hero Slides if empty
    const { rows: slideRows } = await sql`SELECT count(*) FROM hero_slides`;
    if (parseInt(slideRows[0].count) === 0) {
        await sql`
            INSERT INTO hero_slides (id, title, subtitle, image_url)
            VALUES ('slide-1', 'Rent what you need, when you need it.', 'Explore thousands of items from trusted owners near you.', 'https://images.unsplash.com/photo-1529251848243-c5a5b58c566a?q=80&w=2070&auto=format&fit=crop')
        `;
    }

    // Migration for missing columns in existing tables
    try {
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_instant_book BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT ARRAY[]::TEXT[]`;
    } catch (e) {
        console.log("Migration minor check done");
    }

    // Insert Mock Users (Only if table is empty)
    const { rows: userRows } = await sql`SELECT count(*) FROM users`;
    if (parseInt(userRows[0].count) === 0) {
        for (const user of mockUsers) {
            await sql`
                INSERT INTO users (id, name, email, registered_date, avatar_url, is_email_verified, is_phone_verified, is_id_verified, average_rating, total_reviews, favorites)
                VALUES (${user.id}, ${user.name}, ${user.email}, ${user.registeredDate}, ${user.avatarUrl}, ${user.isEmailVerified}, ${user.isPhoneVerified}, ${user.isIdVerified}, ${user.averageRating}, ${user.totalReviews}, ${user.favorites as any})
            `;
        }
    }

    return res.status(200).json({ message: 'Database seeded successfully', details: 'Tables created and initial data inserted.' });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
