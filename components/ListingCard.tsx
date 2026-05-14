
import React from 'react';
import { Listing } from '../types';
import { MapPinIcon, StarIcon, HeartIcon, ZapIcon } from './icons';

interface ListingCardProps {
    listing: Listing;
    onClick: (id: string) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, isFavorite, onToggleFavorite }) => {
    return (
        <div 
            className="group cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white flex flex-col relative"
            onClick={() => onClick(listing.id)}
        >
            <div className="relative h-56 overflow-hidden">
                <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(listing.id); }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors z-10"
                    >
                        <HeartIcon className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                )}

                <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
                    <div className="bg-white/95 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xl backdrop-blur-md border border-white/20">
                        {listing.pricingType === 'hourly' 
                            ? `$${listing.pricePerHour}/hr` 
                            : `$${listing.pricePerDay}/day`}
                    </div>
                </div>

                {listing.isInstantBook && (
                    <div className="absolute bottom-3 left-3 bg-cyan-500 text-white px-2 py-1 rounded-lg shadow-xl flex items-center gap-1.5 animate-in slide-in-from-left-4 duration-500 z-10" title="Instant Book Available">
                        <ZapIcon className="h-3 w-3 fill-white" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Instant</span>
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 truncate">{listing.title}</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                    {listing.category}
                    {listing.subcategory && ` / ${listing.subcategory}`}
                </p>
                <div className="flex items-center text-sm text-gray-600 mt-2">
                    <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{listing.location.city}, {listing.location.state}</span>
                </div>
                 <div className="mt-4 flex justify-between items-center text-sm pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400 mr-1"/>
                        <span className="font-bold text-gray-700">{listing.rating}</span>
                        <span className="text-gray-500 ml-1">({listing.reviewsCount} reviews)</span>
                    </div>
                     <div className="flex items-center">
                         <img src={listing.owner.avatarUrl} alt={listing.owner.name} className="w-6 h-6 rounded-full mr-2"/>
                         <span className="text-gray-600">{listing.owner.name.split(' ')[0]}</span>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ListingCard;
