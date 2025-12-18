
// types.ts
export enum ListingCategory {
    MOTORCYCLES = "Motorcycles",
    BIKES = "Bikes",
    BOATS = "Boats",
    CAMPING = "Camping",
    WINTER_SPORTS = "Winter Sports",
    WATER_SPORTS = "Water Sports",
    RVS = "RVs",
    ATVS_UTVS = "ATVs & UTVs",
}

export enum RiskTier {
    TIER_1_SOFT_GOODS = "SOFT_GOODS",
    TIER_2_POWERSPORTS = "POWERSPORTS"
}

export type ListingType = 'rental' | 'experience';
export type PriceUnit = 'item' | 'person' | 'group';

export type Page = 'home' | 'listingDetail' | 'createListing' | 'editListing' | 'aiAssistant' | 'admin' | 'userDashboard' | 'aboutUs' | 'careers' | 'press' | 'helpCenter' | 'contactUs' | 'terms' | 'privacyPolicy' | 'explore' | 'howItWorks' | 'floridaCompliance' | 'inbox' | 'userProfile';

export interface User {
    id: string;
    name: string;
    email: string;
    registeredDate: string;
    avatarUrl: string;
    bio?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isIdVerified?: boolean;
    licenseVerified?: boolean;
    averageRating?: number;
    totalReviews?: number;
    status?: 'active' | 'suspended';
    favorites: string[];
    // FIX: Added 'role' property to support SUPER_ADMIN checks and other role-based logic.
    role?: string;
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
    hasGpsTracker?: boolean;
    hasCommercialInsurance?: boolean;
    securityDeposit?: number;
    listingType?: ListingType;
    operatorLicenseId?: string;
    fuelPolicy?: 'included' | 'extra';
    skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
    whatsIncluded?: string;
    itinerary?: string;
    priceUnit?: PriceUnit;
    instantBookingEnabled?: boolean;
    // NEW: Persist legal strategy choice
    legalTemplateSelection?: 'standard' | 'custom';
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
    participants: { [key: string]: User };
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
    protectionType: 'waiver' | 'insurance'; 
    protectionFee: number;
    amountPaidOnline: number;
    balanceDueOnSite: number;
    contractSignature?: {
        signedBy: string;
        signedAt: string;
        contractType: string;
    };
    paymentMethod?: 'platform' | 'direct';
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';
    inspectionResult?: 'clean' | 'damaged';
    hasHandoverInspection?: boolean;
    hasReturnInspection?: boolean;
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

export interface InspectionPhoto {
    url: string;
    angleId: string;
    angleLabel: string;
    timestamp: string;
    latitude?: number;
    longitude?: number;
    takenByUserId: string;
}

export interface Inspection {
    id: string;
    bookingId: string;
    status: 'pending_handover' | 'active' | 'pending_return' | 'completed' | 'disputed';
    handoverPhotos: InspectionPhoto[];
    returnPhotos: InspectionPhoto[];
    damageReported: boolean;
    notes: string;
}
