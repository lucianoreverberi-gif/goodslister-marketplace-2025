import { Listing, User, HeroSlide, Banner, ListingCategory, Conversation, CategoryImagesMap, Booking } from './types';

const BLOB_BASE_URL = 'https://vmne9ccmbthkpv5j.public.blob.vercel-storage.com';

export const mockUsers: User[] = [
    {
        id: 'user-1',
        name: 'Carlos Gomez',
        email: 'carlos.gomez@example.com',
        registeredDate: '2023-01-15',
        avatarUrl: `${BLOB_BASE_URL}/avatar-carlos.jpg`,
        isEmailVerified: true,
        isPhoneVerified: false,
        isIdVerified: false,
        averageRating: 4.8,
        totalReviews: 12,
        favorites: [],
    },
    {
        id: 'user-2',
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@example.com',
        registeredDate: '2023-02-20',
        avatarUrl: `${BLOB_BASE_URL}/avatar-ana.jpg`,
        isEmailVerified: true,
        isPhoneVerified: true,
        isIdVerified: true,
        averageRating: 4.9,
        totalReviews: 21,
        favorites: ['listing-1'],
    },
    {
        id: 'user-3',
        name: 'Luciano Reverberi',
        email: 'lucianoreverberi@gmail.com',
        registeredDate: '2023-01-01',
        avatarUrl: `${BLOB_BASE_URL}/avatar-luciano.jpg`,
        isEmailVerified: true,
        isPhoneVerified: true,
        isIdVerified: false,
        averageRating: 5.0,
        totalReviews: 2,
        favorites: [],
    },
];

export const mockListings: Listing[] = [
    {
        id: 'listing-1',
        title: 'Adventure Double Kayak',
        description: 'Perfect for exploring lakes and rivers. Stable and safe, ideal for two people. Includes paddles and life vests.',
        category: ListingCategory.WATER_SPORTS,
        subcategory: 'Kayak',
        pricingType: 'daily',
        pricePerDay: 50,
        location: { city: 'Bariloche', state: 'Río Negro', country: 'Argentina', latitude: -41.1335, longitude: -71.3103 },
        owner: mockUsers[0],
        images: [`${BLOB_BASE_URL}/listing-kayak-1.jpg`, `${BLOB_BASE_URL}/listing-kayak-2.jpg`],
        videoUrl: 'https://www.youtube.com/watch?v=1_pA6MvT_fA',
        isFeatured: true,
        rating: 4.8,
        reviewsCount: 25,
        bookedDates: ['2025-11-10', '2025-11-11'],
        ownerRules: "1. Must be returned clean.\n2. Renter is responsible for any damage.",
    },
    {
        id: 'listing-2',
        title: 'Scott Spark Mountain Bike',
        description: 'High-end mountain bike, perfect for trails and difficult terrain.',
        category: ListingCategory.BIKES,
        subcategory: 'Mountain',
        pricingType: 'daily',
        pricePerDay: 60,
        location: { city: 'Mendoza', state: 'Mendoza', country: 'Argentina', latitude: -32.8895, longitude: -68.8458 },
        owner: mockUsers[1],
        images: [`${BLOB_BASE_URL}/listing-bike-1.jpg`],
        isFeatured: true,
        rating: 4.9,
        reviewsCount: 18,
    },
    {
        id: 'listing-3',
        title: 'Burton Pro Snowboard',
        description: 'Experience the mountain with this professional snowboard.',
        category: ListingCategory.WINTER_SPORTS,
        subcategory: 'Snowboard',
        pricingType: 'daily',
        pricePerDay: 75,
        location: { city: 'Ushuaia', state: 'Tierra del Fuego', country: 'Argentina', latitude: -54.8019, longitude: -68.3030 },
        owner: mockUsers[0],
        images: [`${BLOB_BASE_URL}/listing-snowboard-1.jpg`],
        isFeatured: true,
        rating: 4.9,
        reviewsCount: 31,
    }
];

export const initialHeroSlides: HeroSlide[] = [
    {
        id: 'slide-1',
        title: 'Rent what you need, when you need it.',
        subtitle: 'Explore thousands of items from trusted owners near you.',
        imageUrl: `${BLOB_BASE_URL}/hero-1.jpg`,
    },
];

export const initialBanners: Banner[] = [
    {
        id: 'banner-1',
        title: 'Earn extra money with your items',
        description: 'Do you have gear you don\'t use? List it on Goodslister.',
        buttonText: 'List your item now',
        imageUrl: `${BLOB_BASE_URL}/banner-1.jpg`,
    },
];

export const initialCategoryImages: CategoryImagesMap = {
    [ListingCategory.MOTORCYCLES]: `${BLOB_BASE_URL}/category-motorcycles.jpg`,
    [ListingCategory.BIKES]: `${BLOB_BASE_URL}/category-bikes.jpg`,
    [ListingCategory.BOATS]: `${BLOB_BASE_URL}/category-boats.jpg`,
    [ListingCategory.CAMPING]: `${BLOB_BASE_URL}/category-camping.jpg`,
    [ListingCategory.WINTER_SPORTS]: `${BLOB_BASE_URL}/category-winter-sports.jpg`,
    [ListingCategory.WATER_SPORTS]: `${BLOB_BASE_URL}/category-water-sports.jpg`,
    [ListingCategory.RVS]: `${BLOB_BASE_URL}/category-rvs.jpg`,
    [ListingCategory.ATVS_UTVS]: `${BLOB_BASE_URL}/category-atvs.jpg`,
};

export const subcategories: { [key in ListingCategory]: string[] } = {
    [ListingCategory.MOTORCYCLES]: ["Adventure", "Cruiser", "Sport", "Touring", "Dual-Sport"],
    [ListingCategory.BIKES]: ["Mountain", "Road", "Hybrid", "BMX", "E-Bike"],
    [ListingCategory.BOATS]: ["Speedboat", "Fishing Boat", "Sailboat", "Pontoon", "Yacht"],
    [ListingCategory.CAMPING]: ["Tent", "Backpack", "Sleeping Bag", "Cooler", "Stove"],
    [ListingCategory.WINTER_SPORTS]: ["Skis", "Snowboard", "Snowshoes", "Sled", "Ice Skates"],
    [ListingCategory.WATER_SPORTS]: ["Kayak", "Surfboard", "Paddleboard", "Wakeboard", "Jet Ski", "Wingfoil", "Kitesurf"],
    [ListingCategory.RVS]: ["Class A", "Class C", "Campervan", "Travel Trailer", "Fifth Wheel"],
    [ListingCategory.ATVS_UTVS]: ["Sport ATV (Quad)", "Utility ATV (4x4)", "Sport Side-by-Side (SxS)", "Utility UTV", "4-Seater Crew", "Dune Buggy", "Youth ATV"],
};

export const mockConversations: Conversation[] = [];

export const mockBookings: Booking[] = [
    {
        id: 'booking-1',
        listingId: 'listing-3',
        listing: mockListings[2],
        renterId: 'user-2',
        startDate: '2024-08-10',
        endDate: '2024-08-15',
        totalPrice: 450,
        status: 'confirmed',
        protectionType: 'waiver',
        protectionFee: 45,
        paymentMethod: 'platform',
        amountPaidOnline: 450,
        balanceDueOnSite: 0
    }
];