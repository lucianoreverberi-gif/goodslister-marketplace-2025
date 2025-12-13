
// services/mockApiService.ts
import { 
    User, Listing, HeroSlide, Banner, Conversation, 
    CategoryImagesMap, ListingCategory, Booking 
} from '../types';
import { initialCategoryImages, mockUsers, mockListings, initialHeroSlides, initialBanners, mockBookings } from '../constants';
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
            conversations: [], // STRICT REAL MODE: No mock conversations
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
            conversations: [], // Empty conversations for fallback
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

/**
 * Sends a message to the backend API.
 * REMOVED: Fallback to local fake data. Now forces DB usage.
 */
export const sendMessageToBackend = async (
    senderId: string, 
    text: string, 
    listingId?: string, 
    recipientId?: string, 
    conversationId?: string
): Promise<{ success: boolean, conversationId?: string }> => {
    try {
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId,
                senderId,
                text,
                listingId,
                recipientId
            })
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, conversationId: data.conversationId };
        }
        console.error("Chat backend failed", await response.text());
        return { success: false };
    } catch (e) {
        console.error("Chat backend unavailable:", e);
        return { success: false };
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

// NEW: Full profile update (Bio + Avatar)
export const updateUserProfile = async (userId: string, bio: string, avatarUrl: string): Promise<User[]> => {
    await sendAdminAction('updateUserProfile', { userId, bio, avatarUrl });
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

export const toggleFavorite = async (userId: string, listingId: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/user/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, listingId }),
        });
        return response.ok;
    } catch (e) {
        console.error("Toggle favorite failed:", e);
        return false;
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

export const deleteListing = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/listings/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        return response.ok;
    } catch (e) {
        console.error("Failed to delete listing:", e);
        return false;
    }
};


export const updatePaymentApiKey = async (newKey: string): Promise<string> => {
    // Client-side state only for security demo
    return newKey;
};

export const updateConversations = async (updatedConversations: Conversation[]): Promise<Conversation[]> => {
    // Deprecated for real-time DB sync
    return updatedConversations;
};

export const createBooking = async (
    listingId: string, 
    renterId: string, 
    startDate: Date, 
    endDate: Date, 
    totalPrice: number, 
    amountPaidOnline: number,
    balanceDueOnSite: number,
    paymentMethod: 'platform' | 'direct',
    protectionType: 'waiver' | 'insurance',
    protectionFee: number
): Promise<{ newBooking: Booking, updatedListing: Listing }> => {
    // --- LIVE BACKEND INTEGRATION ---
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
                amountPaidOnline, 
                balanceDueOnSite, 
                paymentMethod, 
                protectionType, 
                protectionFee 
            }),
        });

        if (response.ok) {
            const result = await response.json();
            const booking = result.booking;
            const data = await fetchAllData();
            const updatedListing = data.listings.find(l => l.id === listingId)!;
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
            amountPaidOnline,
            balanceDueOnSite,
            paymentMethod,
            status: 'confirmed',
            protectionType,
            protectionFee
        };
        
        const newBookedDates = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'yyyy-MM-dd'));
        const updatedListing = { ...listing, bookedDates: [...(listing.bookedDates || []), ...newBookedDates] };

        return { newBooking, updatedListing };
    }
};

// NEW: Update Booking Status (for moving between tabs like Upcoming -> Active -> History)
export const updateBookingStatus = async (bookingId: string, status: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/bookings/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, status }),
        });
        return response.ok;
    } catch (e) {
        console.error("Failed to update booking status:", e);
        return false;
    }
};
