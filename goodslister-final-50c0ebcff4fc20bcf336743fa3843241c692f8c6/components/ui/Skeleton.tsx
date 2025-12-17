
import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
    );
};

export const ListingCardSkeleton: React.FC = () => {
    return (
        <div className="rounded-lg overflow-hidden shadow-lg bg-white flex flex-col h-full border border-gray-100">
            <div className="relative h-56 w-full">
                <Skeleton className="w-full h-full" />
            </div>
            <div className="p-4 flex flex-col flex-grow space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2 mt-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </div>
    );
};
