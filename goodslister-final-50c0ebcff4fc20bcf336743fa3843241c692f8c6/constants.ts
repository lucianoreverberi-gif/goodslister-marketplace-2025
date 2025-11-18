import { Listing, User, HeroSlide, Banner, ListingCategory, Conversation, CategoryImagesMap, Booking } from './types';

export const mockUsers: User[] = [
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

export const mockListings: Listing[] = [
    {
        id: 'listing-1',
        title: 'Adventure Double Kayak',
        description: 'Perfect for exploring lakes and rivers. Stable and safe, ideal for two people. Includes paddles and life vests. Available for weekends.',
        category: ListingCategory.WATER_SPORTS,
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
        // SIMULATION: Added unavailable dates in Nov 2025 to demonstrate the disabled style.
        bookedDates: ['2025-11-10', '2025-11-11', '2025-11-12', '2025-11-20', '2025-11-21', '2025-11-22', '2025-11-23'],
        ownerRules: "1. Must be returned clean, otherwise a $20 cleaning fee will apply.\n2. Renter is responsible for any damage to the kayak or equipment.\n3. For use in freshwater lakes and rivers only. Not for ocean use.",
    },
    {
        id: 'listing-2',
        title: 'Scott Spark Mountain Bike',
        description: 'High-end mountain bike, perfect for trails and difficult terrain. Full suspension and hydraulic disc brakes for maximum safety.',
        category: ListingCategory.BIKES,
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
        category: ListingCategory.WINTER_SPORTS,
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
        category: ListingCategory.RVS,
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
        category: ListingCategory.WATER_SPORTS,
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
        category: ListingCategory.WATER_SPORTS,
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
        category: ListingCategory.BOATS,
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
        category: ListingCategory.WATER_SPORTS,
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

export const initialHeroSlides: HeroSlide[] = [
    {
        id: 'slide-1',
        title: 'Rent what you need, when you need it.',
        subtitle: 'Explore thousands of items from trusted owners near you. From adventure gear to tools for your next project.',
        imageUrl: 'https://images.unsplash.com/photo-1529251848243-c5a5b58c566a?q=80&w=2070&auto=format&fit=crop',
    },
];

export const initialBanners: Banner[] = [
    {
        id: 'banner-1',
        title: 'Earn extra money with your items',
        description: 'Do you have gear you don\'t use? List it on Goodslister and start generating passive income. It\'s easy, safe, and free.',
        buttonText: 'List your item now',
        imageUrl: 'https://images.unsplash.com/photo-1627922446305-5386f188cedc?q=80&w=2070&auto=format&fit=crop',
    },
];

export const initialCategoryImages: CategoryImagesMap = {
    [ListingCategory.MOTORCYCLES]: 'https://images.unsplash.com/photo-1625043484555-5654b594199c?q=80&w=1974&auto=format&fit=crop',
    [ListingCategory.BIKES]: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=2070&auto=format&fit=crop',
    [ListingCategory.BOATS]: 'https://images.unsplash.com/photo-1593853992454-0371391a03a8?q=80&w=2070&auto=format&fit=crop',
    [ListingCategory.CAMPING]: 'https://images.unsplash.com/photo-1537565266759-34f2b345716d?q=80&w=1974&auto=format&fit=crop',
    [ListingCategory.WINTER_SPORTS]: 'https://images.unsplash.com/photo-1551690628-99de0e94411e?q=80&w=1974&auto=format&fit=crop',
    [ListingCategory.WATER_SPORTS]: 'https://images.unsplash.com/photo-1570533158623-3a5101657c98?q=80&w=2070&auto=format&fit=crop',
    [ListingCategory.RVS]: 'https://images.unsplash.com/photo-1558223533-4c5c7f186358?q=80&w=2070&auto=format&fit=crop',
    [ListingCategory.UTVS]: 'https://images.unsplash.com/photo-1634567292109-768a4b37f2c9?q=80&w=1974&auto=format&fit=crop',
};

export const subcategories: { [key in ListingCategory]: string[] } = {
    [ListingCategory.MOTORCYCLES]: ["Adventure", "Cruiser", "Sport", "Touring", "Dual-Sport"],
    [ListingCategory.BIKES]: ["Mountain", "Road", "Hybrid", "BMX", "E-Bike"],
    [ListingCategory.BOATS]: ["Speedboat", "Fishing Boat", "Sailboat", "Pontoon", "Yacht"],
    [ListingCategory.CAMPING]: ["Tent", "Backpack", "Sleeping Bag", "Cooler", "Stove"],
    [ListingCategory.WINTER_SPORTS]: ["Skis", "Snowboard", "Snowshoes", "Sled", "Ice Skates"],
    [ListingCategory.WATER_SPORTS]: ["Kayak", "Surfboard", "Paddleboard", "Wakeboard", "Jet Ski", "Wingfoil", "Kitesurf"],
    [ListingCategory.RVS]: ["Class A", "Class C", "Campervan", "Travel Trailer", "Fifth Wheel"],
    // FIX: Corrected a typo in the key to match the 'ListingCategory' enum.
    [ListingCategory.UTVS]: ["Sport", "Utility", "4-Seater", "2-Seater"],
};

export const mockConversations: Conversation[] = [
    {
        id: 'convo-1',
        participants: {
            'user-1': mockUsers[0],
            'user-2': mockUsers[1],
        },
        listing: mockListings[1], // Bike
        messages: [
            { id: 'msg-1', senderId: 'user-1', text: 'Hi Ana, is the bike available this weekend?', timestamp: '2024-07-20T10:00:00Z'},
            { id: 'msg-2', senderId: 'user-2', text: 'Hi Carlos! Yes, it\'s available. Would you like to book it?', timestamp: '2024-07-20T10:05:00Z'},
        ],
    },
];

export const mockBookings: Booking[] = [
    {
        id: 'booking-1',
        listingId: 'listing-3', // Snowboard
        listing: mockListings[2],
        renterId: 'user-2',
        startDate: '2024-08-10',
        endDate: '2024-08-15',
        totalPrice: 450,
        status: 'confirmed'
    }
];
