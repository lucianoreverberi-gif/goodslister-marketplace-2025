
// FIX: Removed google.maps type reference as type definitions are not available.
// All google.maps types will be treated as 'any'.

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Listing, ListingCategory } from '../types';
import ListingCard from './ListingCard';
import { SearchIcon, MapPinIcon, LocateIcon, LayoutDashboardIcon, SlidersIcon, TagIcon, DollarSignIcon } from './icons';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { FilterCriteria } from '../services/geminiService';
import { ListingCardSkeleton } from './ui/Skeleton';
import { subcategories } from '../constants';

interface ExplorePageProps {
    listings: Listing[];
    onListingClick: (id: string) => void;
    initialFilters?: FilterCriteria | null;
    onClearInitialFilters: () => void;
    favorites: string[];
    onToggleFavorite: (id: string) => void;
}

type SortOption = 'price_desc' | 'price_asc' | 'rating_desc';

const API_KEY = 'AIzaSyBXEVAhsLGBPWixJlR7dv5FLdybcr5SOP0';
const LIBRARIES: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 25.7617, // Miami default
  lng: -80.1918
};

const ExplorePage: React.FC<ExplorePageProps> = ({ listings, onListingClick, initialFilters, onClearInitialFilters, favorites, onToggleFavorite }) => {
    // Filter and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<ListingCategory[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    
    const absoluteMaxPrice = useMemo(() => {
        if (listings.length === 0) return 5000;
        return Math.max(...listings.map(l => l.pricingType === 'daily' ? (l.pricePerDay || 0) : (l.pricePerHour || 0)));
    }, [listings]);

    // Price range state
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(absoluteMaxPrice);
    
    const [sortBy, setSortBy] = useState<SortOption>('rating_desc');
    const [locationFilter, setLocationFilter] = useState('');
    const [isLoadingListings, setIsLoadingListings] = useState(true);

    // Map specific state
    const [map, setMap] = useState<any>(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(10);
    const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [autocomplete, setAutocomplete] = useState<any>(null);
    const [userManuallySearched, setUserManuallySearched] = useState(false);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(550);
    const [isResizing, setIsResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        const timer = setTimeout(() => setIsLoadingListings(false), 600);
        return () => {
            window.removeEventListener('resize', checkMobile);
            clearTimeout(timer);
        };
    }, []);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: API_KEY!,
        libraries: LIBRARIES,
    });
    
    useEffect(() => {
        if (initialFilters) {
            setSearchTerm(initialFilters.text || '');
            setSelectedCategories(initialFilters.category ? [initialFilters.category] : []);
            setLocationFilter(initialFilters.location || '');
            onClearInitialFilters();
        }
    }, [initialFilters, onClearInitialFilters]);

    const onMapLoad = useCallback((mapInstance: any) => setMap(mapInstance), []);
    const onAutocompleteLoad = useCallback((autocompleteInstance: any) => setAutocomplete(autocompleteInstance), []);

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                setMapCenter({ lat: newLat, lng: newLng });
                setMapZoom(12);
                setUserManuallySearched(true);
                if (isMobile) setMobileView('map');
            }
            if (place.name || place.formatted_address) {
                const locName = place.name || place.formatted_address;
                const simplifiedLoc = locName.split(',').slice(0, 2).join(',');
                setLocationFilter(simplifiedLoc);
            }
        }
    };

    // Sidebar Resize Logic
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const newWidth = e.clientX;
        if (newWidth >= 400 && newWidth <= window.innerWidth * 0.7) setSidebarWidth(newWidth);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleCategoryToggle = (category: ListingCategory) => {
        setSelectedCategories(prev => {
            setUserManuallySearched(false);
            const isRemoving = prev.includes(category);
            if (isRemoving) {
                const subsToRemove = subcategories[category] || [];
                setSelectedSubcategories(sPrev => sPrev.filter(s => !subsToRemove.includes(s)));
            }
            return isRemoving ? prev.filter(c => c !== category) : [...prev, category];
        });
    };

    const handleSubcategoryToggle = (sub: string) => {
        setSelectedSubcategories(prev => 
            prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setSelectedSubcategories([]);
        setMinPrice(0);
        setMaxPrice(absoluteMaxPrice);
        setSortBy('rating_desc');
        setLocationFilter('');
        setMapZoom(4);
        setUserManuallySearched(false);
    };

    const filteredAndSortedListings = useMemo(() => {
        let filtered = listings.filter(listing => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ? 
                listing.title.toLowerCase().includes(searchTermLower) || 
                listing.description.toLowerCase().includes(searchTermLower) : true;

            const matchesCategory = selectedCategories.length > 0 ? 
                selectedCategories.includes(listing.category) : true;
            
            const matchesSubcategory = selectedSubcategories.length > 0 ?
                selectedSubcategories.includes(listing.subcategory || '') : true;

            const locationFilterLower = locationFilter.toLowerCase();
            const matchesLocation = locationFilter ?
                listing.location.city.toLowerCase().includes(locationFilterLower) ||
                listing.location.state.toLowerCase().includes(locationFilterLower)
                : true;

            const price = listing.pricingType === 'daily' ? (listing.pricePerDay || 0) : (listing.pricePerHour || 0);
            const matchesPrice = price >= minPrice && price <= maxPrice;

            return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice && matchesLocation;
        });

        switch (sortBy) {
            case 'price_desc': filtered.sort((a, b) => (b.pricePerDay || 0) - (a.pricePerDay || 0)); break;
            case 'price_asc': filtered.sort((a, b) => (a.pricePerDay || 0) - (b.pricePerDay || 0)); break;
            case 'rating_desc': filtered.sort((a, b) => b.rating - a.rating); break;
        }

        return filtered;
    }, [listings, searchTerm, selectedCategories, selectedSubcategories, minPrice, maxPrice, sortBy, locationFilter]);
    
    useEffect(() => {
        if (!userManuallySearched && map && filteredAndSortedListings.length > 0) {
            if (filteredAndSortedListings.length === 1) {
                const l = filteredAndSortedListings[0];
                map.panTo({ lat: l.location.latitude, lng: l.location.longitude });
                map.setZoom(14);
            } else {
                const bounds = new (window as any).google.maps.LatLngBounds();
                filteredAndSortedListings.forEach(l => bounds.extend({ lat: l.location.latitude, lng: l.location.longitude }));
                map.fitBounds(bounds);
            }
        } 
    }, [filteredAndSortedListings, map, userManuallySearched]);

    const availableSubcategories = useMemo(() => {
        if (selectedCategories.length === 0) return [];
        let subs: string[] = [];
        selectedCategories.forEach(cat => {
            subs = [...subs, ...(subcategories[cat] || [])];
        });
        return [...new Set(subs)];
    }, [selectedCategories]);

    if (loadError) return <div className="p-8 text-center">Error loading maps.</div>;

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden relative">
            {/* Mobile Toggle */}
            <div className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => setMobileView(prev => prev === 'list' ? 'map' : 'list')}
                    className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest border border-gray-700"
                >
                    {mobileView === 'list' ? <><MapPinIcon className="h-4 w-4 text-cyan-400" /> View Map</> : <><LayoutDashboardIcon className="h-4 w-4 text-cyan-400" /> View List</>}
                </button>
            </div>

            {/* Left Panel */}
            <div
                style={!isMobile ? { width: `${sidebarWidth}px` } : {}}
                className={`w-full flex-col flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ${isMobile ? (mobileView === 'map' ? 'hidden' : 'flex h-full') : 'flex'}`}
            >
                {/* Filters Sidebar */}
                <div className="flex-shrink-0 bg-gray-50 border-b overflow-y-auto max-h-[50vh] lg:max-h-none">
                    <div className="p-6 space-y-6">
                        {/* Search & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Keywords</label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kayaks, bikes..." className="w-full pl-9 pr-4 py-2 bg-white border-gray-200 rounded-xl text-sm focus:ring-cyan-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Location</label>
                                <div className="relative">
                                    {isLoaded ? (
                                        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                                            <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="City, State" className="w-full pl-3 pr-8 py-2 bg-white border-gray-200 rounded-xl text-sm focus:ring-cyan-500" />
                                        </Autocomplete>
                                    ) : <div className="w-full h-9 bg-gray-100 animate-pulse rounded-xl" />}
                                    <button onClick={() => navigator.geolocation.getCurrentPosition(p => { setMapCenter({lat: p.coords.latitude, lng: p.coords.longitude}); setMapZoom(13); setUserManuallySearched(true); })} className="absolute right-2 top-2.5 text-gray-400 hover:text-cyan-600"><LocateIcon className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Price Range Dual */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSignIcon className="h-3 w-3" /> Price Range
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">$</span>
                                    <span className="text-sm font-black text-cyan-700">{minPrice} - ${maxPrice}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="relative h-2 bg-gray-100 rounded-full">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={absoluteMaxPrice} 
                                        value={minPrice} 
                                        onChange={e => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer accent-cyan-600 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                                    />
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={absoluteMaxPrice} 
                                        value={maxPrice} 
                                        onChange={e => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer accent-cyan-600 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500">Min: ${minPrice}</div>
                                    <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500">Max: ${maxPrice}</div>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(ListingCategory).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryToggle(cat)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                            selectedCategories.includes(cat)
                                                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-500'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subcategories (Improved Colors) */}
                        {availableSubcategories.length > 0 && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                    <TagIcon className="h-3 w-3" /> Specific Gear Type
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableSubcategories.map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => handleSubcategoryToggle(sub)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${
                                                selectedSubcategories.includes(sub)
                                                    ? 'bg-cyan-700 text-white border-cyan-700 shadow-md scale-105'
                                                    : 'bg-white text-cyan-900 border-cyan-100 hover:border-cyan-400 hover:bg-cyan-50/50'
                                            }`}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-2 border-t flex justify-between items-center">
                            <button onClick={clearFilters} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-tighter">Reset all filters</button>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-xs font-bold bg-transparent border-none text-gray-900 focus:ring-0 cursor-pointer">
                                <option value="rating_desc">Top Rated</option>
                                <option value="price_asc">Cheapest First</option>
                                <option value="price_desc">Premium First</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {isLoadingListings ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => <ListingCardSkeleton key={i} />)}
                        </div>
                    ) : filteredAndSortedListings.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredAndSortedListings.map(listing => (
                                <div key={listing.id} onMouseEnter={() => setHoveredListingId(listing.id)} onMouseLeave={() => setHoveredListingId(null)}>
                                    <ListingCard listing={listing} onClick={onListingClick} isFavorite={favorites.includes(listing.id)} onToggleFavorite={onToggleFavorite} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><SearchIcon className="h-8 w-8 text-gray-300" /></div>
                            <h3 className="text-xl font-black text-gray-900">No results found</h3>
                            <p className="mt-2 text-gray-500 text-sm max-w-[250px] mx-auto leading-relaxed">Adjust your price range or try removing some specific gear types.</p>
                            <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest">Clear Filters</button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Draggable Divider */}
            {!isMobile && (
                <div onMouseDown={handleMouseDown} className={`w-1 cursor-col-resize hover:bg-cyan-500 transition-colors duration-200 z-30 ${isResizing ? 'bg-cyan-600' : 'bg-gray-100'}`}></div>
            )}

            {/* Map */}
            <div className={`flex-1 relative h-full ${isMobile && mobileView === 'list' ? 'hidden' : 'block'}`}>
                {isLoaded ? (
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={mapZoom} onLoad={onMapLoad} options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false }}>
                        {filteredAndSortedListings.map(listing => (
                            <Marker
                                key={listing.id}
                                position={{ lat: listing.location.latitude, lng: listing.location.longitude }}
                                onClick={() => setSelectedListing(listing)}
                                icon={{
                                    path: (window as any).google.maps.SymbolPath.CIRCLE,
                                    scale: hoveredListingId === listing.id ? 10 : 7,
                                    fillColor: hoveredListingId === listing.id ? "#06B6D4" : "#10B981",
                                    fillOpacity: 1,
                                    strokeColor: "white",
                                    strokeWeight: 2,
                                }}
                            />
                        ))}
                        {selectedListing && (
                            <InfoWindow position={{ lat: selectedListing.location.latitude, lng: selectedListing.location.longitude }} onCloseClick={() => setSelectedListing(null)}>
                                <div className="w-48 cursor-pointer overflow-hidden rounded-xl" onClick={() => onListingClick(selectedListing.id)}>
                                    <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-24 object-cover" />
                                    <div className="p-3 bg-white">
                                        <p className="font-black text-gray-900 text-xs truncate">{selectedListing.title}</p>
                                        <p className="text-cyan-600 font-bold text-sm mt-1">${selectedListing.pricingType === 'daily' ? selectedListing.pricePerDay : selectedListing.pricePerHour}</p>
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                ) : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold animate-pulse">Loading Satellite Data...</div>}
            </div>
        </div>
    );
};

export default ExplorePage;
