
// services/mockApiService.ts
import { 
    User, Listing, HeroSlide, Banner, Conversation, 
    CategoryImagesMap, ListingCategory, Booking, Message
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

// Internal memory store for fallback/demo mode
let localConversations: Conversation[] = [...mockConversations];

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
            // If DB returns empty conversations, check if we have local ones (hybrid mode)
            conversations: data.conversations && data.conversations.length > 0 ? data.conversations : localConversations,
            bookings: data.bookings.length ? data.bookings : mockBookings,
        };
    } catch (error) {
        console.log("Running in Local/Fallback Mode (using mock data)");
        
        return {
            users: mockUsers,
            listings: mockListings,
            heroSlides: initialHeroSlides,
            banners: initialBanners,
            categoryImages: initialCategoryImages,
            logoUrl: 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
            paymentApiKey: '',
            conversations: localConversations,
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
        if (!response.ok && response.status !== 404) {
             console.error("Failed to save admin action:", await response.text());
        }
    } catch (e) {
        console.warn("Could not save to backend (likely local mode).");
    }
};

export const sendEmail = async (type: 'welcome' | 'booking_confirmation' | 'message_notification', to: string, data: any) => {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, data }),
        });
        
        if (!response.ok) return false;
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Sends a message to the backend API, creating the conversation if needed.
 * Includes a robust fallback to local memory if the backend fails.
 */
export const sendMessageToBackend = async (
    senderId: string, 
    text: string, 
    listingId?: string, 
    recipientId?: string, 
    conversationId?: string
): Promise<{ success: boolean, conversationId?: string }> => {
    // 1. Try Real Backend
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
        throw new Error("Backend failed");
    } catch (e) {
        console.warn("Chat backend unavailable, falling back to local simulation.", e);
        
        // 2. Fallback to Local Memory (Demo Mode)
        // This ensures the UI doesn't break if the DB isn't set up.
        
        let targetId = conversationId;
        
        if (!targetId && listingId && recipientId) {
            // Check if exists locally
            const existing = localConversations.find(c => 
                c.listing.id === listingId && 
                c.participants[senderId] && 
                c.participants[recipientId]
            );
            
            if (existing) {
                targetId = existing.id;
            } else {
                // Create new local convo
                targetId = `local-convo-${Date.now()}`;
                
                // Need to find the listing and users to construct the object
                // We'll grab them from the mock constants for simplicity in fallback
                const listing = mockListings.find(l => l.id === listingId) || mockListings[0];
                const sender = mockUsers.find(u => u.id === senderId) || mockUsers[0];
                const recipient = mockUsers.find(u => u.id === recipientId) || mockUsers[1];

                const newConvo: Conversation = {
                    id: targetId,
                    listing: listing,
                    participants: {
                        [sender.id]: sender,
                        [recipient.id]: recipient
                    },
                    messages: []
                };
                localConversations = [...localConversations, newConvo];
            }
        }

        if (targetId) {
            const newMessage: Message = {
                id: `local-msg-${Date.now()}`,
                senderId,
                text,
                originalText: text,
                timestamp: new Date().toISOString(),
            };

            // Update the local store
            localConversations = localConversations.map(c => 
                c.id === targetId 
                    ? { ...c, messages: [...c.messages, newMessage] } 
                    : c
            );
            
            return { success: true, conversationId: targetId };
        }

        return { success: false };
    }
};


export const updateListingImage = async (listingId: string, newImageUrl: string): Promise<Listing[]> => {
    await sendAdminAction('updateListingImage', { listingId, newImageUrl });
    const data = await fetchAllData(); 
    return data.listings.map(l => l.id === listingId ? { ...l, images: [newImageUrl, ...l.images.slice(1)] } : l);
};

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
    return data.users;
};

export const updateUserAvatar = async (userId: string, newAvatarUrl: string): Promise<User[]> => {
    await sendAdminAction('updateUserAvatar', { userId, url: newAvatarUrl });
    const data = await fetchAllData();
    return data.users;
};

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

export const updatePaymentApiKey = async (newKey: string): Promise<string> => {
    return newKey;
};

export const updateConversations = async (updatedConversations: Conversation[]): Promise<Conversation[]> => {
    // This function is for manual state updates from App.tsx
    // We sync our local fallback store here
    localConversations = updatedConversations;
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
