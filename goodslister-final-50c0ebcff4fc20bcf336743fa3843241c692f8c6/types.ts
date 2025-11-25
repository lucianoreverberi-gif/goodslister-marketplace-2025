
// types.ts
export enum ListingCategory {
    MOTORCYCLES = "Motorcycles",
    BIKES = "Bikes",
    BOATS = "Boats",
    CAMPING = "Camping",
    WINTER_SPORTS = "Winter Sports",
    WATER_SPORTS = "Water Sports",
    RVS = "RVs",
    UTVS = "UTVs",
}

export type Page = 'home' | 'listingDetail' | 'createListing' | 'editListing' | 'aiAssistant' | 'admin' | 'userDashboard' | 'aboutUs' | 'careers' | 'press' | 'helpCenter' | 'contactUs' | 'terms' | 'privacyPolicy' | 'explore' | 'howItWorks';

export interface User {
    id: string;
    name: string;
    email: string;
    registeredDate: string;
    avatarUrl: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isIdVerified?: boolean;
    averageRating?: number;
    totalReviews?: number;
    status?: 'active' | 'suspended'; // Added status for admin control
}

export interface Session extends User {
    isAdmin?: boolean;
}

export interface Location {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    category: ListingCategory;
    subcategory?: string;
    pricePerDay?: number;
    pricePerHour?: number;
    pricingType: 'daily' | 'hourly';
    location: Location;
    owner: User;
    images: string[];
    videoUrl?: string;
    isFeatured?: boolean;
    rating: number;
    reviewsCount: number;
    bookedDates?: string[];
    ownerRules?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
}

export interface Banner {
    id: string;
    title: string;
    description: string;
    buttonText: string;
    imageUrl: string;
    layout?: 'overlay' | 'split' | 'wide';
    linkUrl?: string;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    originalText?: string;
    timestamp: string;
}

export interface Conversation {
    id: string;
    participants: { [key: string]: User }; // participantId -> User object
    listing: Listing;
    messages: Message[];
}

export type CategoryImagesMap = { [key in ListingCategory]: string };

export interface Booking {
    id: string;
    listingId: string;
    listing: Listing;
    renterId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    insurancePlan?: 'standard' | 'essential' | 'premium';
    paymentMethod?: 'platform' | 'direct';
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'inspection_pending';
    inspectionResult?: 'clean' | 'damaged';
}

export interface Dispute {
    id: string;
    bookingId: string;
    reporterId: string;
    reason: 'damage' | 'late_return' | 'not_as_described' | 'cancellation';
    description: string;
    status: 'open' | 'resolved' | 'escalated';
    dateOpened: string;
    amountInvolved: number;
}

export interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    usageLimit: number;
    usedCount: number;
    expiryDate: string;
    status: 'active' | 'expired';
}
