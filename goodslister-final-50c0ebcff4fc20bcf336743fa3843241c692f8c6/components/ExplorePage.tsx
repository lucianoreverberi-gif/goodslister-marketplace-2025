// FIX: Removed google.maps type reference as type definitions are not available.
// All google.maps types will be treated as 'any'.

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Listing, ListingCategory } from '../types';
import ListingCard from './ListingCard';
import { SearchIcon, MapPinIcon, LocateIcon } from './icons';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { FilterCriteria } from '../services/geminiService';

interface ExplorePageProps {
    listings: Listing[];
    onListingClick: (id: string) => void;
    initialFilters?: FilterCriteria | null;
    onClearInitialFilters: () => void;
}

type SortOption = 'price_desc' | 'price_asc' | 'rating_desc';

// TODO: For production, this key should be moved to a secure environment variable (e.g., process.env.API_KEY).
const API_KEY = 'AIzaSyBXEVAhsLGBPWixJlR7dv5FLdybcr5SOP0';
const LIBRARIES: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -38.4161, // Centered on Argentina
  lng: -63.6167
};

const ExplorePage: React.FC<ExplorePageProps> = ({ listings, onListingClick, initialFilters, onClearInitialFilters }) => {
    // Filter and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<ListingCategory[]>([]);
    const maxPrice = useMemo(() => Math.max(...listings.map(l => l.pricePerDay || 0), 100), [listings]);
    const [priceRange, setPriceRange] = useState<number>(maxPrice);
    const [sortBy, setSortBy] = useState<SortOption>('rating_desc');
    const [locationFilter, setLocationFilter] = useState('');

    // Map specific state
    const [map, setMap] = useState<any>(null); // Use state for map instance to solve race condition
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(4);
    const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(550);
    const [isResizing, setIsResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: API_KEY!,
        libraries: LIBRARIES,
    });
    
    // Apply initial filters from homepage search
    useEffect(() => {
        if (initialFilters) {
            setSearchTerm(initialFilters.text || '');
            setSelectedCategories(initialFilters.category ? [initialFilters.category] : []);
            setLocationFilter(initialFilters.location || '');
            onClearInitialFilters(); // Clear after applying to prevent re-applying
        }
    }, [initialFilters, onClearInitialFilters]);


    // Callback to store the map instance once it's loaded
    const onMapLoad = useCallback((mapInstance: any) => {
        setMap(mapInstance);
    }, []);

    // Resizing handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const newWidth = e.clientX;
        const minWidth = 400;
        const maxWidth = Math.round(window.innerWidth * 0.6);
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
        }
    }, []);

    useEffect(() => {
        if (!isResizing) return;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);


    const handleCategoryToggle = (category: ListingCategory) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setPriceRange(maxPrice);
        setSortBy('rating_desc');
        setLocationFilter('');
    };

    const filteredAndSortedListings = useMemo(() => {
        let filtered = listings.filter(listing => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ? 
                listing.title.toLowerCase().includes(searchTermLower) || 
                listing.description.toLowerCase().includes(searchTermLower) : true;

            const matchesCategory = selectedCategories.length > 0 ? 
                selectedCategories.includes(listing.category) : true;
            
            const locationFilterLower = locationFilter.toLowerCase();
            const matchesLocation = locationFilter ?
                listing.location.city.toLowerCase().includes(locationFilterLower) ||
                listing.location.state.toLowerCase().includes(locationFilterLower)
                : true;

            const price = listing.pricingType === 'daily' ? listing.pricePerDay : listing.pricePerHour;
            const matchesPrice = price ? price <= priceRange : true;


            return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
        });

        switch (sortBy) {
            case 'price_desc':
                filtered.sort((a, b) => (b.pricePerDay || 0) - (a.pricePerDay || 0));
                break;
            case 'price_asc':
                filtered.sort((a, b) => (a.pricePerDay || 0) - (b.pricePerDay || 0));
                break;
            case 'rating_desc':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
        }

        return filtered;
    }, [listings, searchTerm, selectedCategories, priceRange, sortBy, locationFilter]);
    
    // Automatically adjust the map view to fit the filtered listings
    useEffect(() => {
        if (map && filteredAndSortedListings.length > 0) {
            // If there's only one result, center and zoom directly on it
            if (filteredAndSortedListings.length === 1) {
                const singleListing = filteredAndSortedListings[0];
                map.panTo({
                    lat: singleListing.location.latitude,
                    lng: singleListing.location.longitude,
                });
                map.setZoom(14); // A good zoom level for a city area
            } else {
                // If there are multiple results, fit them all within the map bounds
                const bounds = new (window as any).google.maps.LatLngBounds();
                filteredAndSortedListings.forEach(listing => {
                    bounds.extend({ lat: listing.location.latitude, lng: listing.location.longitude });
                });
                map.fitBounds(bounds);
            }
        } else if (map) {
            // Reset map view to the default if there are no results
            map.panTo(defaultCenter);
            map.setZoom(4);
        }
    }, [filteredAndSortedListings, map]);


    const handleUseMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapCenter({ lat: latitude, lng: longitude });
                    setMapZoom(13);
                    setLocationFilter('');
                },
                () => {
                    alert('Error: The Geolocation service failed or was denied.');
                }
            );
        } else {
            alert("Your browser doesn't support geolocation.");
        }
    };

    if (loadError) return <div className="p-8 text-center">Error loading maps. Please check the API key.</div>;
    if (!isLoaded) return <div className="p-8 text-center">Loading map and listings...</div>;

    return (
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)] md:overflow-hidden">
            {/* Left Panel */}
            <div
                style={!isMobile ? { width: `${sidebarWidth}px` } : {}}
                className="w-full flex flex-col flex-shrink-0"
            >
                <div className="p-4 border-b">
                    {/* Filters */}
                    <div className="space-y-4">
                        {/* Location Filter */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-bold text-gray-800">Location</label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    id="location"
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    placeholder="Search for a city"
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={handleUseMyLocation}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-cyan-600"
                                    aria-label="Use my current location"
                                >
                                    <LocateIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Category</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {Object.values(ListingCategory).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryToggle(category)}
                                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                                            selectedCategories.includes(category)
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                         {/* Search Filter */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-bold text-gray-800">Keyword</label>
                            <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search for keywords..."
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-b">
                    <p className="text-sm text-gray-600">{filteredAndSortedListings.length} results</p>
                    <select 
                        id="sort-by"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortOption)}
                        className="text-sm border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md shadow-sm"
                    >
                        <option value="rating_desc">Highest Rated</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="price_asc">Price: Low to High</option>
                    </select>
                </div>

                {/* Listing Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredAndSortedListings.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredAndSortedListings.map(listing => (
                                <div
                                    key={listing.id}
                                    onMouseEnter={() => setHoveredListingId(listing.id)}
                                    onMouseLeave={() => setHoveredListingId(null)}
                                >
                                    <ListingCard listing={listing} onClick={onListingClick} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold text-gray-800">No results found</h3>
                            <p className="mt-2 text-gray-600">Try adjusting your filters.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Draggable Divider */}
            <div
                onMouseDown={handleMouseDown}
                className="hidden md:block w-2 cursor-col-resize bg-gray-200 hover:bg-cyan-400 active:bg-cyan-500 transition-colors duration-200"
            ></div>

            {/* Right Panel - Map */}
            <div className="flex-1 relative h-96 md:h-auto">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={mapZoom}
                    onLoad={onMapLoad}
                    options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false, mapTypeControl: false }}
                >
                    {filteredAndSortedListings.map(listing => (
                        <Marker
                            key={listing.id}
                            position={{ lat: listing.location.latitude, lng: listing.location.longitude }}
                            onClick={() => setSelectedListing(listing)}
                            onMouseOver={() => setHoveredListingId(listing.id)}
                            onMouseOut={() => setHoveredListingId(null)}
                            icon={{
                                // FIX: Cast 'window' to 'any' to access 'google.maps' without type definitions.
                                path: (window as any).google.maps.SymbolPath.CIRCLE,
                                scale: hoveredListingId === listing.id ? 10 : 7,
                                fillColor: hoveredListingId === listing.id ? "#06B6D4" : "#10B981",
                                fillOpacity: 0.9,
                                strokeColor: "white",
                                strokeWeight: 2,
                            }}
                        />
                    ))}
                    {selectedListing && (
                        <InfoWindow
                            position={{ lat: selectedListing.location.latitude, lng: selectedListing.location.longitude }}
                            onCloseClick={() => setSelectedListing(null)}
                        >
                            <div className="w-48 cursor-pointer" onClick={() => onListingClick(selectedListing.id)}>
                                <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-24 object-cover rounded-t-md" />
                                <div className="p-2">
                                    <p className="font-bold text-sm truncate">{selectedListing.title}</p>
                                    <p className="text-xs text-gray-600">${selectedListing.pricePerDay}/day</p>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </div>
        </div>
    );
};

export default ExplorePage;