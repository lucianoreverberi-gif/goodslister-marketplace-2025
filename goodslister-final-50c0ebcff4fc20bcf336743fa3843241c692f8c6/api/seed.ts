
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
        bio TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_phone_verified BOOLEAN DEFAULT FALSE,
        is_id_verified BOOLEAN DEFAULT FALSE,
        license_verified BOOLEAN DEFAULT FALSE,
        average_rating NUMERIC(3, 2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        favorites TEXT[] DEFAULT ARRAY[]::TEXT[],
        role VARCHAR(50) DEFAULT 'USER',
        home_region VARCHAR(10)
      );
    `;

    // 2. Create Listings Table (Added country_code, currency, instant_booking_enabled)
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
        country_code VARCHAR(5) DEFAULT 'US',
        currency VARCHAR(5) DEFAULT 'USD',
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
        price_unit VARCHAR(20) DEFAULT 'item',
        instant_booking_enabled BOOLEAN DEFAULT FALSE
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
    
    // ... (Rest of tables: payments, hero_slides, banners, inspections, reviews, site_config, conversations...)
    await sql`CREATE TABLE IF NOT EXISTS payments (id VARCHAR(255) PRIMARY KEY, booking_id VARCHAR(255) REFERENCES bookings(id), payer_id VARCHAR(255) REFERENCES users(id), payee_id VARCHAR(255) REFERENCES users(id), amount NUMERIC(10, 2), platform_fee NUMERIC(10, 2), protection_fee NUMERIC(10, 2), owner_payout NUMERIC(10, 2), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS hero_slides (id VARCHAR(255) PRIMARY KEY, title TEXT, subtitle TEXT, image_url TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS banners (id VARCHAR(255) PRIMARY KEY, title TEXT, description TEXT, button_text TEXT, image_url TEXT, layout TEXT DEFAULT 'overlay', link_url TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS inspections (id VARCHAR(255) PRIMARY KEY, booking_id VARCHAR(255) REFERENCES bookings(id), status VARCHAR(50), handover_photos JSONB, return_photos JSONB, damage_reported BOOLEAN DEFAULT FALSE, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS reviews (id VARCHAR(255) PRIMARY KEY, booking_id VARCHAR(255) REFERENCES bookings(id), author_id VARCHAR(255) REFERENCES users(id), target_id VARCHAR(255) REFERENCES users(id), role VARCHAR(20), rating NUMERIC(3, 2), comment TEXT, private_note TEXT, care_rating NUMERIC(3, 2), clean_rating NUMERIC(3, 2), accuracy_rating NUMERIC(3, 2), safety_rating NUMERIC(3, 2), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS site_config (key VARCHAR(255) PRIMARY KEY, value TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS conversations (id VARCHAR(255) PRIMARY KEY, listing_id VARCHAR(255), updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS conversation_participants (conversation_id VARCHAR(255) REFERENCES conversations(id), user_id VARCHAR(255), PRIMARY KEY (conversation_id, user_id))`;
    await sql`CREATE TABLE IF NOT EXISTS messages (id VARCHAR(255) PRIMARY KEY, conversation_id VARCHAR(255) REFERENCES conversations(id), sender_id VARCHAR(255), content TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    // Run migrations for existing columns if needed
    try {
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'rental'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS operator_license_id TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS fuel_policy VARCHAR(20)`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS skill_level VARCHAR(20)`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS whats_included TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS itinerary TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20) DEFAULT 'item'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS country_code VARCHAR(5) DEFAULT 'US'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS currency VARCHAR(5) DEFAULT 'USD'`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER'`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS home_region VARCHAR(10)`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid_online NUMERIC(10, 2) DEFAULT 0`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_due_on_site NUMERIC(10, 2) DEFAULT 0`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT ARRAY[]::TEXT[]`;
        // NEW MIGRATION
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS instant_booking_enabled BOOLEAN DEFAULT FALSE`;
        
        // --- FIX FOR YOUR ERROR: Adding the missing risk/hardware columns ---
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_gps_tracker BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_commercial_insurance BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0`;
    } catch (e) {
        console.log("Migration skipped", e);
    }

    // --- SEEDING STRATEGY ---
    
    // 1. Users
    for (const user of mockUsers) {
        await sql`
            INSERT INTO users (id, name, email, registered_date, avatar_url, bio, is_email_verified, is_phone_verified, is_id_verified, average_rating, total_reviews, favorites, role)
            VALUES (${user.id}, ${user.name}, ${user.email}, ${user.registeredDate || '2023-01-01'}, ${user.avatarUrl}, ${user.bio || ''}, ${user.isEmailVerified}, ${user.isPhoneVerified}, ${user.isIdVerified}, ${user.averageRating}, ${user.totalReviews}, ${user.favorites as any}, ${user.email.includes('admin') ? 'SUPER_ADMIN' : 'USER'})
            ON CONFLICT (id) DO NOTHING
        `;
    }
    console.log('Users synced');

    // 2. Listings
    for (const listing of mockListings) {
        const ownerExists = mockUsers.find(u => u.id === listing.owner.id);
        if (ownerExists) {
             await sql`
                INSERT INTO listings (
                    id, title, description, category, subcategory, 
                    price_per_day, price_per_hour, pricing_type, 
                    location_city, location_state, location_country, location_lat, location_lng,
                    owner_id, images, video_url, is_featured, rating, reviews_count, booked_dates, owner_rules, 
                    has_gps_tracker, has_commercial_insurance, security_deposit, listing_type, price_unit,
                    country_code, currency, instant_booking_enabled
                )
                VALUES (
                    ${listing.id}, ${listing.title}, ${listing.description}, ${listing.category}, ${listing.subcategory},
                    ${listing.pricePerDay || 0}, ${listing.pricePerHour || 0}, ${listing.pricingType},
                    ${listing.location.city}, ${listing.location.state}, ${listing.location.country}, ${listing.location.latitude}, ${listing.location.longitude},
                    ${listing.owner.id}, ${listing.images as any}, ${listing.videoUrl || ''}, ${listing.isFeatured}, ${listing.rating}, ${listing.reviewsCount}, ${listing.bookedDates as any}, ${listing.ownerRules || ''}, 
                    ${listing.hasGpsTracker || false}, ${listing.hasCommercialInsurance || false}, ${listing.securityDeposit || 0},
                    ${listing.listingType || 'rental'}, ${listing.priceUnit || 'item'},
                    'US', 'USD', ${listing.instantBookingEnabled || false}
                )
                ON CONFLICT (id) DO NOTHING
            `;
        }
    }
    console.log('Listings synced');

    // 3. Bookings
    for (const booking of mockBookings) {
        const listingExists = mockListings.find(l => l.id === booking.listingId);
        const renterExists = mockUsers.find(u => u.id === booking.renterId);
        if (listingExists && renterExists) {
             await sql`
                INSERT INTO bookings (id, listing_id, renter_id, start_date, end_date, total_price, status, protection_type, protection_fee, payment_method, amount_paid_online, balance_due_on_site)
                VALUES (${booking.id}, ${booking.listingId}, ${booking.renterId}, ${booking.startDate}, ${booking.endDate}, ${booking.totalPrice}, ${booking.status}, ${booking.protectionType}, ${booking.protectionFee}, ${booking.paymentMethod || 'platform'}, ${booking.amountPaidOnline || 0}, ${booking.balanceDueOnSite || 0})
                ON CONFLICT (id) DO NOTHING
            `;
        }
    }
    console.log('Bookings synced');

    return res.status(200).json({ message: 'Database verified and core data synced successfully.' });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
