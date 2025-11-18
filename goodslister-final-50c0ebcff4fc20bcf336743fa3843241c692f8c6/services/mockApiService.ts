// services/mockApiService.ts
import { 
    User, Listing, HeroSlide, Banner, Conversation, 
    CategoryImagesMap, ListingCategory, Booking 
} from '../types';
import { 
    mockUsers, mockListings, initialHeroSlides, initialBanners, 
    mockConversations, initialCategoryImages, mockBookings
} from '../constants';
// FIX: Removed `isWithinInterval` which was causing a "not exported" error.
import { eachDayOfInterval, format } from 'date-fns';

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

const LOCAL_STORAGE_KEY = 'goodslister_database';
const API_DELAY = 300; // ms

// --- Private Helper Functions to simulate DB access ---

const readDb = (): AppData => {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error("Error reading from mock DB (localStorage):", error);
    }
    // If DB doesn't exist, initialize it with default data
    const initialData: AppData = {
        users: mockUsers,
        listings: mockListings,
        heroSlides: initialHeroSlides,
        banners: initialBanners,
        categoryImages: initialCategoryImages,
        logoUrl: 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png',
        paymentApiKey: 'pk_test_51...SAMPLE...wLz',
        conversations: mockConversations,
        bookings: mockBookings,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
};

const writeDb = (data: AppData): void => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error writing to mock DB (localStorage):", error);
    }
};

// --- Public API Functions ---

/** Fetches all initial data for the application. */
export const fetchAllData = (): Promise<AppData> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const data = readDb();
            resolve(data);
        }, API_DELAY * 2); // Longer initial load
    });
};

/** Simulates user login. */
export const loginUser = (email: string): Promise<User | null> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            const user = db.users.find(u => u.email === email);
            resolve(user || null);
        }, API_DELAY);
    });
};

/** Simulates user registration. */
export const registerUser = (name: string, email: string): Promise<User | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const db = readDb();
            if (db.users.some(u => u.email === email)) {
                reject(new Error("User already exists"));
                return;
            }
            const newUser: User = {
                id: `user-${db.users.length + 1}`,
                name,
                email,
                registeredDate: new Date().toISOString().split('T')[0],
                avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
                isEmailVerified: false,
                isPhoneVerified: false,
                isIdVerified: false,
                averageRating: 0,
                totalReviews: 0,
            };
            db.users.push(newUser);
            writeDb(db);
            resolve(newUser);
        }, API_DELAY);
    });
};


/** Updates a listing's primary image. */
export const updateListingImage = (listingId: string, newImageUrl: string): Promise<Listing[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            const updatedListings = db.listings.map(listing =>
                listing.id === listingId
                    ? { ...listing, images: [newImageUrl, ...listing.images.slice(1)] }
                    : listing
            );
            // Do not persist to localStorage if it's a base64 string, to avoid quota errors.
            // The change will be held in React state for the session.
            if (!newImageUrl.startsWith('data:image')) {
                db.listings = updatedListings;
                writeDb(db);
            }
            resolve(updatedListings);
        }, API_DELAY * 2); // Simulate upload time
    });
};

/** Updates the site logo. */
export const updateLogo = (newUrl: string): Promise<string> => {
     return new Promise(resolve => {
        setTimeout(() => {
            // If it's a base64 string, don't attempt to save it to localStorage
            // to prevent quota errors. The change will be held in React state for the session.
            if (!newUrl.startsWith('data:image')) {
                const db = readDb();
                db.logoUrl = newUrl;
                writeDb(db);
            }
            resolve(newUrl);
        }, API_DELAY * 2); // Simulate upload
    });
};

/** Generic function to add to a collection. */
const addToCollection = <T>(collectionName: keyof AppData, item: T): Promise<T[]> => {
     return new Promise(resolve => {
         setTimeout(() => {
            const db = readDb();
            const newCollection = [...(db[collectionName] as T[]), item];
            (db as any)[collectionName] = newCollection;
            writeDb(db);
            resolve(newCollection);
        }, API_DELAY);
    });
}

/** Generic function to delete from a collection. */
const deleteFromCollection = <T extends {id: string}>(collectionName: keyof AppData, id: string): Promise<T[]> => {
     return new Promise(resolve => {
         setTimeout(() => {
            const db = readDb();
            // FIX: Cast through `unknown` to satisfy TypeScript's strict checks for union types.
            const newCollection = (db[collectionName] as unknown as T[]).filter(i => i.id !== id);
            (db as any)[collectionName] = newCollection;
            writeDb(db);
            resolve(newCollection);
        }, API_DELAY);
    });
}

export const updateSlide = (slide: HeroSlide): Promise<HeroSlide[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            const updatedSlides = db.heroSlides.map(s => s.id === slide.id ? slide : s);
            
            // Only persist if the image URL is not a large base64 string.
            if (!slide.imageUrl.startsWith('data:image')) {
                db.heroSlides = updatedSlides;
                writeDb(db);
            }
            
            // Always resolve with the in-memory updated list for the UI.
            resolve(updatedSlides);
        }, API_DELAY);
    });
};
export const addSlide = (slide: HeroSlide) => addToCollection('heroSlides', slide);
export const deleteSlide = (id: string) => deleteFromCollection('heroSlides', id);


export const updateBanner = (banner: Banner): Promise<Banner[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            const updatedBanners = db.banners.map(b => b.id === banner.id ? banner : b);
            
            if (!banner.imageUrl.startsWith('data:image')) {
                db.banners = updatedBanners;
                writeDb(db);
            }
            
            resolve(updatedBanners);
        }, API_DELAY);
    });
};
export const addBanner = (banner: Banner) => addToCollection('banners', banner);
export const deleteBanner = (id: string) => deleteFromCollection('banners', id);

export const toggleFeaturedListing = (id: string): Promise<Listing[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            db.listings = db.listings.map(l => l.id === id ? {...l, isFeatured: !l.isFeatured} : l);
            writeDb(db);
            resolve(db.listings);
        }, API_DELAY);
    });
}

export const updatePaymentApiKey = (newKey: string): Promise<string> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            db.paymentApiKey = newKey;
            writeDb(db);
            resolve(db.paymentApiKey);
        }, API_DELAY);
    });
}

export const updateCategoryImage = (category: ListingCategory, newUrl: string): Promise<CategoryImagesMap> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            const updatedCategoryImages = { ...db.categoryImages, [category]: newUrl };

            if (!newUrl.startsWith('data:image')) {
                db.categoryImages = updatedCategoryImages;
                writeDb(db);
            }
            
            resolve(updatedCategoryImages);
        }, API_DELAY * 2);
    });
};

export const updateUserVerification = (userId: string, verificationType: 'email' | 'phone' | 'id'): Promise<User[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            db.users = db.users.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        isEmailVerified: verificationType === 'email' ? true : user.isEmailVerified,
                        isPhoneVerified: verificationType === 'phone' ? true : user.isPhoneVerified,
                        isIdVerified: verificationType === 'id' ? true : user.isIdVerified,
                    };
                }
                return user;
            });
            writeDb(db);
            resolve(db.users);
        }, API_DELAY);
    });
}

export const updateUserAvatar = (userId: string, newAvatarUrl: string): Promise<User[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            db.users = db.users.map(user =>
                user.id === userId ? { ...user, avatarUrl: newAvatarUrl } : user
            );
            if (!newAvatarUrl.startsWith('data:image')) {
                writeDb(db);
            }
            resolve(db.users);
        }, API_DELAY * 2);
    });
};

export const updateConversations = (updatedConversations: Conversation[]): Promise<Conversation[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = readDb();
            db.conversations = updatedConversations;
            writeDb(db);
            resolve(db.conversations);
        }, API_DELAY / 2); // Faster for chat
    });
};

export const createBooking = (listingId: string, renterId: string, startDate: Date, endDate: Date, totalPrice: number): Promise<{ newBooking: Booking, updatedListing: Listing }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const db = readDb();
            const listing = db.listings.find(l => l.id === listingId);
            
            if (!listing) {
                return reject(new Error("Listing not found."));
            }

            // FIX: Replaced `isWithinInterval` to fix module export error.
            // This new logic is more robust: it generates all dates for the potential
            // new booking and checks if any of them already exist in the listing's booked dates.
            const newBookedDates = eachDayOfInterval({ start: startDate, end: endDate }).map(date => format(date, 'yyyy-MM-dd'));
            const existingBookedDates = new Set(listing.bookedDates || []);
            const isDateConflict = newBookedDates.some(day => existingBookedDates.has(day));

            if (isDateConflict) {
                return reject(new Error("Some of the selected dates are already booked."));
            }

            // Create new booking
            const newBooking: Booking = {
                id: `booking-${Date.now()}`,
                listingId,
                listing: { ...listing, owner: { ...listing.owner } }, // Deep copy to prevent circular refs in JSON
                renterId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalPrice,
                status: 'confirmed',
            };
            
            // Update listing with new booked dates
            const updatedListing = {
                ...listing,
                bookedDates: [...(listing.bookedDates || []), ...newBookedDates],
            };
            
            db.bookings.push(newBooking);
            db.listings = db.listings.map(l => l.id === listingId ? updatedListing : l);
            writeDb(db);

            resolve({ newBooking, updatedListing });
        }, API_DELAY * 2);
    });
};
