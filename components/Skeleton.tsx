import React from 'react';

// Loading skeleton components - visual placeholders while data loads
// Better UX than spinners for content-heavy pages

const shimmerClasses = 'animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]';

// Generic building block
export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`${shimmerClasses} rounded-lg ${className}`} />
);

// Listing card skeleton (matches ListingCard structure)
export const ListingCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <SkeletonBox className="w-full h-48 rounded-none" />
        <div className="p-4 space-y-3">
            <SkeletonBox className="h-4 w-3/4" />
            <SkeletonBox className="h-3 w-1/2" />
            <div className="flex items-center justify-between pt-2">
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-4 w-20 rounded-full" />
            </div>
        </div>
    </div>
);

// Grid of listing card skeletons
export const ListingsGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, i) => (
            <ListingCardSkeleton key={i} />
        ))}
    </div>
);

// Listing detail page skeleton (matches ListingDetailPage top structure)
export const ListingDetailSkeleton: React.FC = () => (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <SkeletonBox className="h-4 w-32 mb-6" />
        <div className="space-y-4">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-10 w-2/3" />
            <div className="flex items-center gap-4">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-6 w-24 rounded-full" />
                <SkeletonBox className="h-8 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
                <SkeletonBox className="col-span-2 h-96" />
                <div className="space-y-3">
                    <SkeletonBox className="h-44" />
                    <SkeletonBox className="h-44" />
                </div>
            </div>
        </div>
    </div>
);

// Chat message skeleton
export const ChatMessageSkeleton: React.FC = () => (
    <div className="flex items-start gap-3 p-3">
        <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-4 w-3/4" />
        </div>
    </div>
);

// Booking row skeleton (matches BookingItem in Dashboard)
export const BookingRowSkeleton: React.FC = () => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
        <SkeletonBox className="w-20 h-20 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-1/2" />
            <SkeletonBox className="h-3 w-1/3" />
            <SkeletonBox className="h-3 w-1/4" />
        </div>
        <SkeletonBox className="h-8 w-24 rounded-xl" />
    </div>
);

// Text lines skeleton (for descriptions, paragraphs)
export const TextLinesSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBox
                key={i}
                className={`h-3 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`}
            />
        ))}
    </div>
);

// Full-page loading skeleton (fallback for lazy loaded routes)
export const PageLoadingSkeleton: React.FC = () => (
    <div className="min-h-screen bg-slate-50">
        <div className="h-16 bg-white border-b border-slate-100 flex items-center px-6">
            <SkeletonBox className="h-8 w-32" />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
            <SkeletonBox className="h-8 w-1/3 mb-6" />
            <ListingsGridSkeleton count={8} />
        </div>
    </div>
);
