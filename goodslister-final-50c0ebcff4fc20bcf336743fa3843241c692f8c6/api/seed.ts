
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mockUsers, mockListings, mockBookings } from '../constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // --- CHAT TABLES (Critical for Messaging) ---
    await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(255) PRIMARY KEY,
            listing_id VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS conversation_participants (
            conversation_id VARCHAR(255) REFERENCES conversations(id),
            user_id VARCHAR(255),
            PRIMARY KEY (conversation_id, user_id)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            conversation_id VARCHAR(255) REFERENCES conversations(id),
            sender_id VARCHAR(255),
            content TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // --- CORE TABLES ---

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        registered_date DATE,
        avatar_url TEXT,
        bio TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_phone_verified BOOLEAN DEFAULT FALSE,
        is_id_verified BOOLEAN DEFAULT FALSE,
        license_verified BOOLEAN DEFAULT FALSE,
        average_rating NUMERIC(3, 2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        favorites TEXT[] DEFAULT ARRAY[]::TEXT[]
      );
    `;

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
        owner_id VARCHAR(255),
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

    await sql`
        CREATE TABLE IF NOT EXISTS bookings (
            id VARCHAR(255) PRIMARY KEY,
            listing_id VARCHAR(255),
            renter_id VARCHAR(255),
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

    // --- MIGRATIONS ---
    // Fix for "column does not exist" errors on existing tables
    try {
        console.log("Running migrations...");
        
        // 1. Fix User Columns
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT ARRAY[]::TEXT[]`;
        
        // 2. Fix Listings Columns (The specific error you saw)
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_gps_tracker BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_commercial_insurance BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0`;
        
        // 3. Ensure other fields exist (just in case)
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'rental'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS operator_license_id TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS fuel_policy VARCHAR(20)`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS skill_level VARCHAR(20)`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS whats_included TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS itinerary TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20) DEFAULT 'item'`;
        
        // 4. Fix Bookings
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid_online NUMERIC(10, 2) DEFAULT 0`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_due_on_site NUMERIC(10, 2) DEFAULT 0`;
        
        console.log("Migrations completed.");
    } catch (e) {
        console.log("Migration error (might be ignored if columns exist):", e);
    }

    // --- SEED INITIAL DATA IF EMPTY ---
    
    // Users
    const { rows: userRows } = await sql`SELECT count(*) FROM users`;
    if (parseInt(userRows[0].count) === 0) {
        for (const user of mockUsers) {
            await sql`
                INSERT INTO users (id, name, email, registered_date, avatar_url, bio, is_email_verified, is_phone_verified, is_id_verified, average_rating, total_reviews, favorites)
                VALUES (${user.id}, ${user.name}, ${user.email}, ${user.registeredDate}, ${user.avatarUrl}, ${user.bio || ''}, ${user.isEmailVerified}, ${user.isPhoneVerified}, ${user.isIdVerified}, ${user.averageRating}, ${user.totalReviews}, ${user.favorites as any})
            `;
        }
        console.log('Users seeded');
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
                    owner_id, images, video_url, is_featured, rating, reviews_count, booked_dates, owner_rules, 
                    has_gps_tracker, has_commercial_insurance, security_deposit, listing_type, price_unit
                )
                VALUES (
                    ${listing.id}, ${listing.title}, ${listing.description}, ${listing.category}, ${listing.subcategory},
                    ${listing.pricePerDay || 0}, ${listing.pricePerHour || 0}, ${listing.pricingType},
                    ${listing.location.city}, ${listing.location.state}, ${listing.location.country}, ${listing.location.latitude}, ${listing.location.longitude},
                    ${listing.owner.id}, ${listing.images as any}, ${listing.videoUrl || ''}, ${listing.isFeatured}, ${listing.rating}, ${listing.reviewsCount || 0}, ${listing.bookedDates as any}, ${listing.ownerRules || ''}, 
                    ${listing.hasGpsTracker || false}, ${listing.hasCommercialInsurance || false}, ${listing.securityDeposit || 0},
                    ${listing.listingType || 'rental'}, ${listing.priceUnit || 'item'}
                )
            `;
        }
        console.log('Listings seeded');
    }

    return res.status(200).json({ message: 'Database schema verified, migrated, and seeded.' });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
