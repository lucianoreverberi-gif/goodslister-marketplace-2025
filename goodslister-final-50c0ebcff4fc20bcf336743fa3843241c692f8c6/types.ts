
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

// NEW: Define the Risk Tiers for the Hybrid Strategy
export enum RiskTier {
    TIER_1_SOFT_GOODS = "SOFT_GOODS",       // Internal Damage Waiver
    TIER_2_POWERSPORTS = "POWERSPORTS"      // External Insurance
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
    bio?: string; // NEW: Biography field
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isIdVerified?: boolean; // Important for Tier 2
    licenseVerified?: boolean; // NEW: Specific for Powersports/Marine
    averageRating?: number;
    totalReviews?: number;
    status?: 'active' | 'suspended';
    favorites: string[]; // List of Listing IDs
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
    // NEW: Hardware check for Tier 2 Assets
    hasGpsTracker?: boolean;
    
    // NEW: Safety & Legal Configuration
    hasCommercialInsurance?: boolean;
    securityDeposit?: number;

    // NEW: Experience & Hosting Fields
    listingType?: ListingType; // 'rental' or 'experience'
    operatorLicenseId?: string;
    fuelPolicy?: 'included' | 'extra';
    skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
    whatsIncluded?: string;
    itinerary?: string;
    priceUnit?: PriceUnit; // 'item' (default), 'person', 'group'
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
    
    // REFACTORED: Split protection logic
    protectionType: 'waiver' | 'insurance'; 
    protectionFee: number; // The 15% or the $35/day
    insurancePlan?: 'standard' | 'essential' | 'premium'; // Deprecated/Optional now
    
    // NEW: Split Payment Fields
    amountPaidOnline: number; // Service Fee + Protection
    balanceDueOnSite: number; // Base Rental Price (Paid to host)

    // NEW: Legal Contract Signature
    contractSignature?: {
        signedBy: string;
        signedAt: string;
        contractType: string;
    };

    paymentMethod?: 'platform' | 'direct'; // Kept for legacy/analytics, but now mostly 'split'
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    inspectionResult?: 'clean' | 'damaged';
    
    // NEW: Inspection Tracking
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

// NEW: Inspection Interfaces
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

// NEW: Review Interfaces
export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN';

export interface Review {
    id: string;
    bookingId: string;
    authorId: string;
    targetId: string; // The user being reviewed
    role: 'HOST' | 'RENTER';
    rating: number; // 1-5
    comment: string; // Public
    privateNote?: string; // Private
    
    // Specific Metrics (Optional depending on role)
    careRating?: number;    // Renter metric
    cleanRating?: number;   // Renter metric
    accuracyRating?: number; // Host metric
    safetyRating?: number;   // Host metric
    
    status: ReviewStatus;
    createdAt: string;
}
