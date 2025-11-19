
// services/mockApiService.ts
import { 
    User, Listing, HeroSlide, Banner, Conversation, 
    CategoryImagesMap, ListingCategory, Booking 
} from '../types';
import { mockConversations, initialCategoryImages, mockUsers, mockListings, initialHeroSlides, initialBanners, mockBookings } from '../constants';
import { format, eachDayOfInterval } from 'date-fns';

// The entire structure of our "database"
interface AppData {
    users: User[];
    listings: Listing[];
    heroSlides: HeroSlide[];
    banners: Banner[];
    categoryImages: CategoryImagesMap;
    logoUrl: string;
    paymentApiKey: string;
    conversations: Conversation[];
    bookings: Booking[];
}

// --- Data Fetching (READ) ---

/** Fetches all initial data for the application from the Live Database. */
export const fetchAllData = async (): Promise<AppData> => {
    try {
        const response = await fetch('/api/app-data');
        if (!response.ok) {
            // If 404, it's likely local dev or endpoint not ready. Fail silently to fallback.
            if (response.status === 404) {
                throw new Error("API Endpoint not found (Local Mode)");
            }
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        
        // Merge with local constants for things not yet fully DB-backed or if DB is empty on first load
        return {
            users: data.users.length ? data.users : mockUsers,
            listings: data.listings.length ? data.listings : mockListings,
            heroSlides: data.heroSlides.length ? data.heroSlides : initialHeroSlides,
            banners: data.banners.length ? data.banners : initialBanners,
            categoryImages: data.categoryImages || initialCategoryImages,
            logoUrl: data.logoUrl || 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
            paymentApiKey: data.paymentApiKey || '',
            conversations: mockConversations, // Chat still local for MVP
            bookings: data.bookings.length ? data.bookings : mockBookings,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Only log error if it's not the expected local mode 404
        if (!message.includes("Local Mode")) {
            console.error("Failed to fetch live data, falling back to local mode:", error);
        } else {
            console.log("Running in Local Mode (using mock data)");
        }
        
        // Fallback for development if DB isn't connected
        return {
            users: mockUsers,
            listings: mockListings,
            heroSlides: initialHeroSlides,
            banners: initialBanners,
            categoryImages: initialCategoryImages,
            logoUrl: 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
            paymentApiKey: '',
            conversations: mockConversations,
            bookings: mockBookings,
        };
    }
};

// --- Data Updates (WRITE) ---

/** Helper to send updates to the backend */
const sendAdminAction = async (action: string, payload: any) => {
    try {
        const response = await fetch('/api/admin-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
        });
        if (!response.ok) {
            // If it fails (e.g. locally), we just log and rely on optimistic UI updates
             if (response.status === 404) return; // Local mode, do nothing
             console.error("Failed to save admin action:", await response.text());
        }
    } catch (e) {
        // Ignore network errors in local/fallback mode
        console.warn("Could not save to backend (likely local mode).");
    }
};


/** Updates a listing's primary image. */
export const updateListingImage = async (listingId: string, newImageUrl: string): Promise<Listing[]> => {
    await sendAdminAction('updateListingImage', { listingId, newImageUrl });
    // Optimistic return: In a real app we'd re-fetch, but here we simulate the update for UI responsiveness
    const data = await fetchAllData(); 
    // Manually patch the specific listing in case the fetch hasn't propagated or for speed
    return data.listings.map(l => l.id === listingId ? { ...l, images: [newImageUrl, ...l.images.slice(1)] } : l);
};

/** Updates the site logo. */
export const updateLogo = async (newUrl: string): Promise<string> => {
    await sendAdminAction('updateLogo', { url: newUrl });
    return newUrl;
};

export const updateSlide = async (slide: HeroSlide): Promise<HeroSlide[]> => {
    await sendAdminAction('updateSlide', slide);
    const data = await fetchAllData();
    return data.heroSlides.map(s => s.id === slide.id ? slide : s);
};

export const addSlide = async (slide: HeroSlide): Promise<HeroSlide[]> => {
    await sendAdminAction('addSlide', slide);
    const data = await fetchAllData();
    return [...data.heroSlides, slide];
};

export const deleteSlide = async (id: string): Promise<HeroSlide[]> => {
    await sendAdminAction('deleteSlide', { id });
    const data = await fetchAllData();
    return data.heroSlides.filter(s => s.id !== id);
};

export const updateBanner = async (banner: Banner): Promise<Banner[]> => {
    await sendAdminAction('updateBanner', banner);
    const data = await fetchAllData();
    return data.banners.map(b => b.id === banner.id ? banner : b);
};

export const addBanner = async (banner: Banner): Promise<Banner[]> => {
    await sendAdminAction('addBanner', banner);
    const data = await fetchAllData();
    return [...data.banners, banner];
};

export const deleteBanner = async (id: string): Promise<Banner[]> => {
    await sendAdminAction('deleteBanner', { id });
    const data = await fetchAllData();
    return data.banners.filter(b => b.id !== id);
};

export const toggleFeaturedListing = async (id: string): Promise<Listing[]> => {
    await sendAdminAction('toggleFeatured', { id });
    const data = await fetchAllData();
    return data.listings.map(l => l.id === id ? { ...l, isFeatured: !l.isFeatured } : l);
};

export const updateCategoryImage = async (category: ListingCategory, newUrl: string): Promise<CategoryImagesMap> => {
    await sendAdminAction('updateCategoryImage', { category, url: newUrl });
    const data = await fetchAllData();
    return { ...data.categoryImages, [category]: newUrl };
};

export const updateUserVerification = async (userId: string, verificationType: 'email' | 'phone' | 'id'): Promise<User[]> => {
    await sendAdminAction('updateUserVerification', { userId, type: verificationType });
    const data = await fetchAllData();
    return data.users; // Simplified for speed
};

export const updateUserAvatar = async (userId: string, newAvatarUrl: string): Promise<User[]> => {
    await sendAdminAction('updateUserAvatar', { userId, url: newAvatarUrl });
    const data = await fetchAllData();
    return data.users;
};

// --- Local Only (Mocked for MVP) ---

export const loginUser = async (email: string): Promise<User | null> => {
    const data = await fetchAllData();
    return data.users.find(u => u.email === email) || null;
};

export const registerUser = async (name: string, email: string): Promise<User | null> => {
    // In a real app, this would be a POST /api/auth/register
    // For now, we return a mock user but ideally we should insert into DB too.
    // Skipping DB insert for register in this refactor to keep it simple, 
    // but in production this needs an endpoint.
    return {
        id: `user-${Date.now()}`,
        name,
        email,
        registeredDate: new Date().toISOString(),
        avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
        isEmailVerified: false,
    };
};

export const updatePaymentApiKey = async (newKey: string): Promise<string> => {
    // Client-side state only for security demo
    return newKey;
};

export const updateConversations = async (updatedConversations: Conversation[]): Promise<Conversation[]> => {
    // Chat stored in memory for demo
    return updatedConversations;
};

export const createBooking = async (listingId: string, renterId: string, startDate: Date, endDate: Date, totalPrice: number): Promise<{ newBooking: Booking, updatedListing: Listing }> => {
    // For now, bookings are local-only to avoid complex date logic on the server in this step.
    // To make this live, we would need a POST /api/bookings endpoint.
    const data = await fetchAllData();
    const listing = data.listings.find(l => l.id === listingId)!;
    
    const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        listingId,
        listing,
        renterId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice,
        status: 'confirmed',
    };
    
    const newBookedDates = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'yyyy-MM-dd'));
    const updatedListing = { ...listing, bookedDates: [...(listing.bookedDates || []), ...newBookedDates] };

    return { newBooking, updatedListing };
};
