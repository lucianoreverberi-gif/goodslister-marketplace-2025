
// FIX: Removed google.maps type reference as type definitions are not available.
// All google.maps types will be treated as 'any'.

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Listing, ListingCategory } from '../types';
import { subcategories } from '../constants';
import ListingCard from './ListingCard';
import { SearchIcon, MapPinIcon, LocateIcon, LayoutDashboardIcon, XIcon } from './icons';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { FilterCriteria } from '../services/geminiService';

interface ExplorePageProps {
    listings: Listing[];
    onListingClick: (id: string) => void;
    initialFilters?: FilterCriteria | null;
    onClearInitialFilters: () => void;
    favorites: string[];
    onToggleFavorite: (id: string) => void;
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

const ExplorePage: React.FC<ExplorePageProps> = ({ listings, onListingClick, initialFilters, onClearInitialFilters, favorites, onToggleFavorite }) => {
    // Filter and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<ListingCategory[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]); // NEW: Subcategory State
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
    
    // Autocomplete state
    const [autocomplete, setAutocomplete] = useState<any>(null);
    // Track if the map was recently moved by a user search to prevent auto-fitting logic from overriding it immediately
    const [userManuallySearched, setUserManuallySearched] = useState(false);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(550);
    const [isResizing, setIsResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Mobile View State (List vs Map)
    const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

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
    
    // Autocomplete Load
    const onAutocompleteLoad = useCallback((autocompleteInstance: any) => {
        setAutocomplete(autocompleteInstance);
    }, []);

    // Handle Place Changed (User selects a location from dropdown)
    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            
            // 1. Update Map Center & Zoom independent of listings
            if (place.geometry && place.geometry.location) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                
                setMapCenter({ lat: newLat, lng: newLng });
                setMapZoom(12); // Set a comfortable city-level zoom
                
                // Important: Flag that the user manually searched so we don't auto-fit bounds immediately if empty
                setUserManuallySearched(true);
                
                // Switch to map view on mobile when searching location
                if (isMobile) setMobileView('map');
            }

            // 2. Update the Location Filter string to filter the list on the left
            if (place.name || place.formatted_address) {
                // Prefer name (e.g. "Miami"), fallback to address
                const locName = place.name || place.formatted_address;
                // Remove country from string to make matching easier (e.g. "Miami, FL, USA" -> "Miami, FL")
                const simplifiedLoc = locName.split(',').slice(0, 2).join(',');
                setLocationFilter(simplifiedLoc);
            }
        }
    };

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
        setSelectedCategories(prev => {
            // Reset manual search flag when user changes filters, so map can auto-fit to new results
            setUserManuallySearched(false);
            const newSelection = prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category];
            return newSelection;
        });
    };
    
    // NEW: Handle Subcategory Toggle
    const handleSubcategoryToggle = (subcategory: string) => {
        setSelectedSubcategories(prev => {
            setUserManuallySearched(false);
            return prev.includes(subcategory)
                ? prev.filter(s => s !== subcategory)
                : [...prev, subcategory];
        });
    };

    // NEW: Compute available subcategories based on selected categories
    const availableSubcategories = useMemo(() => {
        if (selectedCategories.length === 0) return [];
        // Get all subcategories for the selected parent categories
        // Flatten the array of arrays
        const subs = selectedCategories.flatMap(cat => subcategories[cat] || []);
        // Remove duplicates if any (though unlikely with current structure)
        return Array.from(new Set(subs)).sort();
    }, [selectedCategories]);

    // NEW: Auto-clear selected subcategories if they are no longer valid (e.g. parent category deselected)
    useEffect(() => {
        if (selectedCategories.length === 0) {
            setSelectedSubcategories([]);
            return;
        }
        const validSubs = selectedCategories.flatMap(cat => subcategories[cat] || []);
        setSelectedSubcategories(prev => prev.filter(s => validSubs.includes(s)));
    }, [selectedCategories]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setSelectedSubcategories([]); // NEW
        setPriceRange(maxPrice);
        setSortBy('rating_desc');
        setLocationFilter('');
        setMapZoom(4);
        setMapCenter(defaultCenter);
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
            
            // NEW: Subcategory Match Logic
            const matchesSubcategory = selectedSubcategories.length > 0 ?
                (listing.subcategory && selectedSubcategories.includes(listing.subcategory)) : true;
            
            // Improved Location Matching: Split by comma to handle "City, State" better
            const locationFilterLower = locationFilter.toLowerCase();
            const matchesLocation = locationFilter ?
                listing.location.city.toLowerCase().includes(locationFilterLower) ||
                listing.location.state.toLowerCase().includes(locationFilterLower) ||
                listing.location.country.toLowerCase().includes(locationFilterLower)
                : true;

            const price = listing.pricingType === 'daily' ? listing.pricePerDay : listing.pricePerHour;
            const matchesPrice = price ? price <= priceRange : true;


            return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice && matchesLocation;
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
    }, [listings, searchTerm, selectedCategories, selectedSubcategories, priceRange, sortBy, locationFilter]);
    
    // Automatically adjust the map view to fit the filtered listings
    useEffect(() => {
        // If the user just manually searched for a location (e.g. "Miami"), 
        // we respect their zoom/center choice set in onPlaceChanged.
        // We only auto-fit bounds if they haven't just searched, or if they change other filters.
        if (userManuallySearched) return;

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
        } 
        // Note: We intentionally do NOT reset to defaultCenter if 0 results here, 
        // so the map stays where the user left it.
    }, [filteredAndSortedListings, map, userManuallySearched]);


    const handleUseMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapCenter({ lat: latitude, lng: longitude });
                    setMapZoom(13);
                    setLocationFilter('');
                    setUserManuallySearched(true);
                    if (isMobile) setMobileView('map');
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
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden relative">
            {/* Mobile View Toggle Button */}
            <div className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => setMobileView(prev => prev === 'list' ? 'map' : 'list')}
                    className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm hover:scale-105 transition-transform border border-gray-700"
                >
                    {mobileView === 'list' ? (
                        <>
                            <MapPinIcon className="h-4 w-4" />
                            Show Map
                        </>
                    ) : (
                        <>
                            <LayoutDashboardIcon className="h-4 w-4" />
                            Show List
                        </>
                    )}
                </button>
            </div>

            {/* Left Panel (Filters & List) */}
            <div
                style={!isMobile ? { width: `${sidebarWidth}px` } : {}}
                className={`w-full flex-col flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 
                    ${isMobile ? (mobileView === 'map' ? 'hidden' : 'flex h-full') : 'flex'}
                `}
            >
                <div className="p-4 border-b flex-shrink-0">
                    {/* Filters */}
                    <div className="space-y-4">
                        {/* Location Filter with Autocomplete */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-bold text-gray-800">Location</label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                    <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <Autocomplete
                                    onLoad={onAutocompleteLoad}
                                    onPlaceChanged={onPlaceChanged}
                                >
                                    <input
                                        type="text"
                                        id="location"
                                        value={locationFilter}
                                        onChange={(e) => {
                                            setLocationFilter(e.target.value);
                                            setUserManuallySearched(false); // Reset manual flag if typing manually
                                        }}
                                        placeholder="Search for a city (e.g. Miami)"
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pl-10 pr-10"
                                    />
                                </Autocomplete>
                                <button
                                    type="button"
                                    onClick={handleUseMyLocation}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-cyan-600 z-10"
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

                        {/* NEW: Subcategory Filter */}
                        {availableSubcategories.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="block text-sm font-bold text-gray-800">
                                    Subcategory <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                                </label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {availableSubcategories.map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => handleSubcategoryToggle(sub)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                                                selectedSubcategories.includes(sub)
                                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                                            }`}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setUserManuallySearched(false); // Reset so map can refit based on keyword results
                                    }}
                                    placeholder="Search for keywords..."
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
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
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {filteredAndSortedListings.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredAndSortedListings.map(listing => (
                                <div
                                    key={listing.id}
                                    onMouseEnter={() => setHoveredListingId(listing.id)}
                                    onMouseLeave={() => setHoveredListingId(null)}
                                >
                                    <ListingCard 
                                        listing={listing} 
                                        onClick={onListingClick} 
                                        isFavorite={favorites.includes(listing.id)}
                                        onToggleFavorite={onToggleFavorite}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold text-gray-800">No results found</h3>
                            <p className="mt-2 text-gray-600">
                                We couldn't find any items matching your filters in this location. 
                                <br />Try moving the map or changing your search terms.
                            </p>
                            <button onClick={clearFilters} className="mt-4 text-cyan-600 hover:underline font-medium">
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Draggable Divider (Desktop only) */}
            <div
                onMouseDown={handleMouseDown}
                className="hidden md:block w-2 cursor-col-resize bg-gray-200 hover:bg-cyan-400 active:bg-cyan-500 transition-colors duration-200 flex-shrink-0"
            ></div>

            {/* Right Panel - Map */}
            <div className={`flex-1 relative h-full ${isMobile ? (mobileView === 'list' ? 'hidden' : 'block') : 'block'}`}>
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
