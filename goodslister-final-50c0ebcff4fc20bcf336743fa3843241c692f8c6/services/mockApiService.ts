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
            if (response.status === 404) {
                throw new Error("API Endpoint not found (Local Mode)");
            }
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        
        return {
            users: data.users.length ? data.users : mockUsers,
            listings: data.listings.length ? data.listings : mockListings,
            heroSlides: data.heroSlides.length ? data.heroSlides : initialHeroSlides,
            banners: data.banners.length ? data.banners : initialBanners,
            categoryImages: data.categoryImages || initialCategoryImages,
            logoUrl: data.logoUrl || 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
            paymentApiKey: data.paymentApiKey || '',
            conversations: [], 
            bookings: data.bookings.length ? data.bookings : mockBookings,
        };
    } catch (error) {
        console.log("Running in Local Mode (using mock data)");
        return {
            users: mockUsers,
            listings: mockListings,
            heroSlides: initialHeroSlides,
            banners: initialBanners,
            categoryImages: initialCategoryImages,
            logoUrl: 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
            paymentApiKey: '',
            conversations: [], 
            bookings: mockBookings,
        };
    }
};

// --- Data Updates (WRITE) ---

const sendAdminAction = async (action: string, payload: any) => {
    try {
        const response = await fetch('/api/admin-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
        });
    } catch (e) {
        console.warn("Could not save to backend (likely local mode).");
    }
};

export const loginUser = async (email: string, password?: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: password || 'password' }),
        });

        if (response.ok) {
            return await response.json();
        }
        
        const data = await fetchAllData();
        return data.users.find(u => u.email === email) || null;
    } catch (e) {
        console.error("Login API failed:", e);
        return null;
    }
};

export const registerUser = async (name: string, email: string, password?: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: password || 'password' }),
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (e) {
        console.error("Registration failed:", e);
        return null;
    }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, currentPassword, newPassword }),
        });
        return response.ok;
    } catch (e) {
        return false;
    }
};

export const deleteAccount = async (userId: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        return response.ok;
    } catch (e) {
        return false;
    }
};

export const updateUserProfile = async (userId: string, bio: string, avatarUrl: string): Promise<User[]> => {
    await sendAdminAction('updateUserProfile', { userId, bio, avatarUrl });
    const data = await fetchAllData();
    return data.users;
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
        return false;
    }
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
    try {
        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                listingId, renterId, 
                startDate: startDate.toISOString(), 
                endDate: endDate.toISOString(), 
                totalPrice, amountPaidOnline, balanceDueOnSite, 
                paymentMethod, protectionType, protectionFee 
            }),
        });

        if (response.ok) {
            const result = await response.json();
            const data = await fetchAllData();
            const updatedListing = data.listings.find(l => l.id === listingId)!;
            return { newBooking: { ...result.booking, listing: updatedListing }, updatedListing };
        }
        throw new Error("Failed to create booking");
    } catch (e) {
        const data = await fetchAllData();
        const listing = data.listings.find(l => l.id === listingId)!;
        const newBooking: Booking = {
            id: `booking-${Date.now()}`, listingId, listing, renterId,
            startDate: startDate.toISOString(), endDate: endDate.toISOString(),
            totalPrice, amountPaidOnline, balanceDueOnSite, paymentMethod,
            status: 'confirmed', protectionType, protectionFee
        };
        const updatedListing = { ...listing, bookedDates: [...(listing.bookedDates || [])] };
        return { newBooking, updatedListing };
    }
};

export const updateBookingStatus = async (bookingId: string, status: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/bookings/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, status }),
        });
        return response.ok;
    } catch (e) {
        return false;
    }
};

export const sendEmail = async (type: string, to: string, data: any) => {
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, data }),
        });
        return true;
    } catch (e) {
        return false;
    }
};

export const updateLogo = async (url: string) => { await sendAdminAction('updateLogo', { url }); return url; };
export const updateSlide = async (s: HeroSlide) => { await sendAdminAction('updateSlide', s); return [s]; };
export const addSlide = async (s: HeroSlide) => { await sendAdminAction('addSlide', s); return [s]; };
export const deleteSlide = async (id: string) => { await sendAdminAction('deleteSlide', { id }); return []; };
export const updateBanner = async (b: Banner) => { await sendAdminAction('updateBanner', b); return [b]; };
export const addBanner = async (b: Banner) => { await sendAdminAction('addBanner', b); return [b]; };
export const deleteBanner = async (id: string) => { await sendAdminAction('deleteBanner', { id }); return []; };
export const toggleFeaturedListing = async (id: string) => { await sendAdminAction('toggleFeatured', { id }); return []; };
export const updateCategoryImage = async (category: ListingCategory, url: string) => { await sendAdminAction('updateCategoryImage', { category, url }); return {}; };

export const updateUserVerification = async (userId: string, type: string) => { 
    await sendAdminAction('updateUserVerification', { userId, type }); 
    const data = await fetchAllData();
    return data.users; 
};

export const updateUserAvatar = async (userId: string, url: string) => { 
    await sendAdminAction('updateUserAvatar', { userId, url }); 
    const data = await fetchAllData();
    return data.users;
};

export const updateListingImage = async (listingId: string, newImageUrl: string) => { await sendAdminAction('updateListingImage', { listingId, newImageUrl }); return []; };
export const updatePaymentApiKey = async (k: string) => k;