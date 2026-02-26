
// services/mockApiService.ts
import { 
    User, Listing, HeroSlide, Banner, Conversation, 
    CategoryImagesMap, ListingCategory, Booking 
} from '../types';
import { initialCategoryImages, mockUsers, mockListings, initialHeroSlides, initialBanners, mockBookings } from '../constants';
import { format, eachDayOfInterval } from 'date-fns';

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

export const fetchAllData = async (): Promise<AppData> => {
    try {
        const response = await fetch('/api/app-data');
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
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
            bookings: data.bookings || [],
        };
    } catch (error) {
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

export const sendEmail = async (type: string, to: string, data: any): Promise<boolean> => {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, data }),
        });
        return response.ok;
    } catch (e) {
        console.warn("Email sending failed:", e);
        return false;
    }
};

export const updatePaymentApiKey = async (newKey: string): Promise<string> => {
    return newKey;
};

export const updateListingImage = async (listingId: string, newImageUrl: string): Promise<Listing[]> => {
    await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateListingImage', payload: { listingId, newImageUrl } }),
    });
    const data = await fetchAllData();
    return data.listings;
};

// FIX: Updated signature to take 10 arguments to resolve "Expected 8 arguments, but got 10" error in App.tsx.
// Removed internal re-calculation of amountPaidOnline and balanceDueOnSite as they are now provided directly.
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
        const data = await fetchAllData();
        const listing = data.listings.find(l => l.id === listingId)!;
        
        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                listingId, renterId, startDate: startDate.toISOString(), 
                endDate: endDate.toISOString(), totalPrice, amountPaidOnline, 
                balanceDueOnSite, paymentMethod, protectionType, protectionFee 
            }),
        });

        if (response.ok) {
            const result = await response.json();
            const booking = result.booking;
            return { newBooking: { ...booking, listing }, updatedListing: listing };
        } else {
            throw new Error("Failed to create booking on server");
        }
    } catch (e) {
        throw e;
    }
};

export const loginUser = async (email: string) => (await fetchAllData()).users.find(u => u.email === email) || null;
export const registerUser = async (name: string, email: string) => {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password: 'pw' })});
    return res.ok ? res.json() : null;
};
export const toggleFavorite = async (userId: string, listingId: string) => fetch('/api/user/toggle-favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, listingId })});
export const createListing = async (listing: Listing) => fetch('/api/listings/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listing })}).then(r => r.ok);
export const updateListing = async (listing: Listing) => fetch('/api/listings/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listing })}).then(r => r.ok);
export const deleteListing = async (id: string) => fetch('/api/listings/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })}).then(r => r.ok);
export const updateLogo = async (url: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateLogo', payload: { url } })}).then(() => url);
export const updateSlide = async (slide: any) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateSlide', payload: slide })});
export const addSlide = async (slide: any) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addSlide', payload: slide })}).then(() => fetchAllData().then(d => d.heroSlides));
export const deleteSlide = async (id: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteSlide', payload: { id } })}).then(() => fetchAllData().then(d => d.heroSlides));
export const updateBanner = async (banner: any) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateBanner', payload: banner })});
export const addBanner = async (banner: any) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addBanner', payload: banner })}).then(() => fetchAllData().then(d => d.banners));
export const deleteBanner = async (id: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteBanner', payload: { id } })}).then(() => fetchAllData().then(d => d.banners));
export const toggleFeaturedListing = async (id: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggleFeatured', payload: { id } })}).then(() => fetchAllData().then(d => d.listings));
export const updateCategoryImage = async (category: string, url: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateCategoryImage', payload: { category, url } })}).then(() => fetchAllData().then(d => d.categoryImages));
export const updateUserVerification = async (userId: string, type: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateUserVerification', payload: { userId, type } })}).then(() => fetchAllData().then(d => d.users));
export const updateUserAvatar = async (userId: string, url: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateUserAvatar', payload: { userId, url } })}).then(() => fetchAllData().then(d => d.users));
export const updateUserProfile = async (userId: string, name: string, bio: string, avatarUrl: string) => fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateUserProfile', payload: { userId, name, bio, avatarUrl } })}).then(() => fetchAllData().then(d => d.users));
