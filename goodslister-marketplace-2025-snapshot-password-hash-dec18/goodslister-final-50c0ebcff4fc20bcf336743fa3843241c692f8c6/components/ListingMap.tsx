import React from 'react';
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '0.75rem'
};

const circleOptions = {
    strokeColor: '#06B6D4',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#06B6D4',
    fillOpacity: 0.25,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    radius: 1500, // 1.5km radius
    zIndex: 1
};

interface ListingMapProps {
  center: {
    lat: number;
    lng: number;
  };
}

// TODO: For production, this key should be moved to a secure environment variable (e.g., process.env.API_KEY).
const API_KEY = 'AIzaSyBXEVAhsLGBPWixJlR7dv5FLdybcr5SOP0';
const LIBRARIES: ("places")[] = ['places'];

const ListingMap: React.FC<ListingMapProps> = ({ center }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY!,
    libraries: LIBRARIES,
  });

  if (loadError) {
    return (
        <div style={containerStyle} className="bg-red-100 border border-red-200 flex items-center justify-center text-center p-4 rounded-lg">
            <p className="text-red-700 font-semibold text-sm">
                Error loading maps. The provided API key might be invalid or restricted.
            </p>
        </div>
    );
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      options={{
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: false,
      }}
    >
      <Circle
        center={center}
        options={circleOptions}
      />
    </GoogleMap>
  ) : (
      <div style={containerStyle} className="bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
  );
};

export default ListingMap;