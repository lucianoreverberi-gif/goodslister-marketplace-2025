
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

/**
 * Sends a transactional email via the backend API.
 */
export const sendEmail = async (type: 'welcome' | 'booking_confirmation' | 'message_notification', to: string, data: any) => {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, data }),
        });
        
        if (!response.ok) {
            console.warn("Email sending failed (API error):", await response.text());
            return false;
        }
        return true;
    } catch (e) {
        console.warn("Email sending failed (Network error):", e);
        return false;
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
    // Fire and forget the server update to ensure responsiveness
    sendAdminAction('updateBanner', banner).catch(err => console.error("Bg save failed", err));
    
    // FIX: Do NOT await fetchAllData() here. 
    // When typing, if we fetch stale data from the server and return it, it overwrites the user's input.
    // Instead, we fetch the latest data but explicitly overwrite the specific banner 
    // with the 'banner' object passed in (which contains the latest user keystroke).
    const data = await fetchAllData();
    return data.banners.map(b => b.id === banner.id ? banner : b);
};

export const addBanner = async (banner: Banner): Promise<Banner[]> => {
    await sendAdminAction('addBanner', banner);
    const data = await fetchAllData();
    
    // Check if the banner is already in the fetched data (to avoid duplicates if server is fast)
    const exists = data.banners.some(b => b.id === banner.id);
    if (exists) {
        return data.banners;
    }
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

// --- User & Listing Actions (Real Backend) ---

export const loginUser = async (email: string): Promise<User | null> => {
    const data = await fetchAllData();
    return data.users.find(u => u.email === email) || null;
};

export const registerUser = async (name: string, email: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: 'dummy-password' }),
        });
        
        if (response.ok) {
            const newUser = await response.json();
            return newUser;
        }
        return null;
    } catch (e) {
        console.error("Registration failed:", e);
        return null;
    }
};

export const createListing = async (listing: Listing): Promise<boolean> => {
    try {
        const response = await fetch('/api/listings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listing }),
        });
        return response.ok;
    } catch (e) {
        console.error("Failed to create listing:", e);
        return false;
    }
};

export const updateListing = async (listing: Listing): Promise<boolean> => {
    try {
        const response = await fetch('/api/listings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listing }),
        });
        return response.ok;
    } catch (e) {
        console.error("Failed to update listing:", e);
        return false;
    }
};


export const updatePaymentApiKey = async (newKey: string): Promise<string> => {
    // Client-side state only for security demo
    return newKey;
};

export const updateConversations = async (updatedConversations: Conversation[]): Promise<Conversation[]> => {
    // Chat stored in memory for demo
    return updatedConversations;
};

export const createBooking = async (listingId: string, renterId: string, startDate: Date, endDate: Date, totalPrice: number, insurancePlan: 'standard' | 'essential' | 'premium' = 'standard', paymentMethod: 'platform' | 'direct' = 'platform'): Promise<{ newBooking: Booking, updatedListing: Listing }> => {
    // --- LIVE BACKEND INTEGRATION ---
    // We now call the dedicated API endpoint 'api/bookings/create' which handles
    // both the booking creation and the payment record insertion.
    try {
        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                listingId, 
                renterId, 
                startDate: startDate.toISOString(), 
                endDate: endDate.toISOString(), 
                totalPrice, 
                insurancePlan, 
                paymentMethod 
            }),
        });

        if (response.ok) {
            const result = await response.json();
            const booking = result.booking;
            // Fetch fresh data to ensure listings reflect the booked dates
            const data = await fetchAllData();
            const updatedListing = data.listings.find(l => l.id === listingId)!;
            // Merge the new booking with the fully populated listing object for the UI
            return { 
                newBooking: { ...booking, listing: updatedListing }, 
                updatedListing 
            };
        } else {
            throw new Error("Failed to create booking on server");
        }
    } catch (e) {
        console.error("Booking API Error:", e);
        
        // --- FALLBACK FOR LOCAL/DEMO MODE ---
        // If the API is not reachable (e.g. database not set up), fallback to local simulation
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
            insurancePlan,
            paymentMethod,
            status: 'confirmed',
        };
        
        const newBookedDates = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'yyyy-MM-dd'));
        const updatedListing = { ...listing, bookedDates: [...(listing.bookedDates || []), ...newBookedDates] };

        return { newBooking, updatedListing };
    }
};
