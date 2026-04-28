import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { ListingCategory } from '../types';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL is not configured.");
    }

    const { rows: users } = await sql`SELECT * FROM users`;
    const { rows: listingsRaw } = await sql`SELECT * FROM listings`;
    const { rows: heroSlides } = await sql`SELECT * FROM hero_slides`;
    const { rows: banners } = await sql`SELECT * FROM banners`;
    const { rows: siteConfig } = await sql`SELECT * FROM site_config LIMIT 1`;
    const { rows: bookingsRaw } = await sql`SELECT * FROM bookings`;
      const formattedHeroSlides = heroSlides.map((s: any) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    imageUrl: s.image_url,
  }));

    // Reconstruct listings with their owner
    const formattedListings = listingsRaw.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category as ListingCategory,
      subcategory: l.subcategory,
      pricePerDay: l.price_per_day,
      pricePerHour: l.price_per_hour,
      pricingType: l.pricing_type || 'daily',
      location: {
        city: l.location_city,
        state: l.location_state,
        country: l.location_country,
        countryCode: l.location_country_code,
        latitude: l.location_lat,
        longitude: l.location_lng
      },
      currency: l.currency,
      owner: users.find(u => u.id === l.owner_id) || { id: l.owner_id },
      images: l.images || [],
      videoUrl: l.video_url,
      isFeatured: l.is_featured,
      isInstantBook: l.is_instant_book,
      rating: l.rating || 0,
      reviewsCount: l.reviews_count || 0,
      bookedDates: l.booked_dates || [],
      ownerRules: l.owner_rules,
      approvalStatus: l.approval_status || 'approved',
      hasGpsTracker: l.has_gps_tracker,
      hasCommercialInsurance: l.has_commercial_insurance,
      securityDeposit: l.security_deposit,
      listingType: l.listing_type || 'rental',
      operatorLicenseId: l.operator_license_id,
      fuelPolicy: l.fuel_policy,
      skillLevel: l.skill_level,
      whatsIncluded: l.whats_included,
      itinerary: l.itinerary,
      priceUnit: l.price_unit || 'item',
      contractPreference: l.contract_preference || 'standard',
      customContractUrl: l.custom_contract_url
    }));

    // Reconstruct bookings
    const formattedBookings = bookingsRaw.map((b: any) => ({
        id: b.id,
        listingId: b.listing_id,
        listing: formattedListings.find((l: any) => l.id === b.listing_id) || { id: b.listing_id },
        renterId: b.renter_id,
        startDate: b.start_date,
        endDate: b.end_date,
        totalPrice: b.total_price,
        protectionType: b.protection_type,
        protectionFee: b.protection_fee,
        insurancePlan: b.insurance_plan,
        amountPaidOnline: b.amount_paid_online,
        balanceDueOnSite: b.balance_due_on_site,
        contractSignature: b.contract_signature,
        paymentMethod: b.payment_method,
        status: b.status,
        securityDeposit: b.security_deposit,
        depositStatus: b.deposit_status,
        inspectionResult: b.inspection_result,
        hasHandoverInspection: b.has_handover_inspection,
        hasReturnInspection: b.has_return_inspection,
    }));

    const configRow = siteConfig[0] || {};
    const categoryImages = configRow.category_images || null;
    const logoUrl = configRow.logo_url || 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png';
    const paymentApiKey = configRow.payment_api_key || '';

    return response.status(200).json({
      users,
      listings: formattedListings,
      formattedHeroSlides,
      banners,
      categoryImages,
      logoUrl,
      paymentApiKey,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error("Error fetching data from Postgres:", error);
    // Return empty fallback instead of crashing entirely, for frontend resilience
    return response.status(200).json({
      users: [],
      listings: [],
      heroSlides: [],
      banners: [],
      categoryImages: null,
      logoUrl: 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
      paymentApiKey: '',
      bookings: []
    });
  }
}
