import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Listing } from '@/types';
import { MILAN_UNIVERSITIES } from '@/data/universities';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  listings: Listing[];
  onListingHover?: (listingId: string | null) => void;
  onListingClick?: (listingId: string) => void;
  hoveredListingId?: string | null;
  selectedListingId?: string | null;
  className?: string;
}

// Custom marker icon for single listings
const createCustomIcon = (isHovered: boolean, isSelected: boolean) => {
  const color = isSelected ? '#dc2626' : isHovered ? '#3b82f6' : '#059669';
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transform: ${isHovered || isSelected ? 'scale(1.2)' : 'scale(1)'};
        transition: transform 0.2s ease;
      "></div>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Custom marker icon for grouped listings
const createClusterIcon = (count: number, isHovered: boolean) => {
  const color = isHovered ? '#3b82f6' : '#059669';
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s ease;
      ">
        ${count}🏠
      </div>
    `,
    className: 'cluster-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom marker icon for universities
const createUniversityIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #dc2626;
        border: 2px solid white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: white;
          border-radius: 50%;
          width: 6px;
          height: 6px;
        "></div>
      </div>
    `,
    className: 'university-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

function MapUpdater({ listings }: { listings: Listing[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (listings.length > 0) {
      try {
        const markers = listings.map(listing => L.marker([listing.lat, listing.lng]));
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.error('Error fitting map bounds:', error);
      }
    }
  }, [listings, map]);

  return null;
}

export default function MapView({ 
  listings, 
  onListingHover, 
  onListingClick, 
  hoveredListingId,
  selectedListingId,
  className 
}: MapViewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Group listings by address (normalized), allowing slight coordinate differences
  const groupedListings = listings.reduce((acc, listing) => {
    // Normalize address for grouping - remove extra spaces, convert to lowercase
    const addressKey = listing.addressLine?.trim().toLowerCase().replace(/\s+/g, ' ') || `${listing.lat.toFixed(4)},${listing.lng.toFixed(4)}`;
    if (!acc[addressKey]) acc[addressKey] = [];
    acc[addressKey].push(listing);
    return acc;
  }, {} as Record<string, Listing[]>);

  if (!listings || listings.length === 0) {
    return (
      <div className={`map-container ${className} flex items-center justify-center bg-muted`}>
        <p className="text-muted-foreground">No listings to display on map</p>
      </div>
    );
  }

  return (
    <div className={`map-container ${className}`}>
      <MapContainer
        center={[45.4642, 9.1900]} // Milan center
        zoom={13}
        className="w-full h-full"
        key={`map-${listings.length}`} // Force re-render when listings change
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater listings={listings} />
        
        {/* University Markers */}
        {MILAN_UNIVERSITIES.map((university) => (
          <Marker
            key={university.id}
            position={[university.lat, university.lng]}
            icon={createUniversityIcon()}
          >
            <Popup>
              <div className="w-48 p-2">
                <div className="text-center">
                  <h3 className="font-semibold text-sm text-red-600">
                    🎓 {university.shortName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {university.name}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {Object.entries(groupedListings).map(([key, groupListings]) => {
          const avgLat = groupListings.reduce((sum, l) => sum + l.lat, 0) / groupListings.length;
          const avgLng = groupListings.reduce((sum, l) => sum + l.lng, 0) / groupListings.length;
          const isGroupHovered = groupListings.some(listing => hoveredListingId === listing.id);
          const isGroupSelected = groupListings.some(listing => selectedListingId === listing.id);
          
          if (groupListings.length === 1) {
            // Single listing - use original marker
            const listing = groupListings[0];
            return (
              <Marker
                key={listing.id}
                position={[listing.lat, listing.lng]}
                icon={createCustomIcon(
                  hoveredListingId === listing.id,
                  selectedListingId === listing.id
                )}
                eventHandlers={{
                  mouseover: () => onListingHover?.(listing.id),
                  mouseout: () => onListingHover?.(null),
                  click: () => onListingClick?.(listing.id)
                }}
              >
                <Popup>
                  <div className="w-64 p-2">
                    <div className="flex items-start space-x-3">
                      {listing.images && listing.images[0] && (
                        <img 
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {listing.addressLine}
                        </p>
                        <div className="mt-2">
                          <span className="font-bold text-sm text-green-600">
                            {formatPrice(listing.rentMonthlyEur)}/month
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
          
          // Multiple listings - use cluster marker with Popup for clickable content
          return (
            <Marker
              key={key}
              position={[avgLat, avgLng]}
              icon={createClusterIcon(groupListings.length, isGroupHovered)}
              eventHandlers={{
                mouseover: () => {
                  // Hover on first listing for consistent behavior
                  onListingHover?.(groupListings[0].id);
                },
                mouseout: () => onListingHover?.(null),
              }}
            >
              <Popup>
                <div className="w-80 p-2">
                  <h3 className="font-semibold text-sm mb-3 text-center">
                    {groupListings.length} Properties at {groupListings[0].addressLine}
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groupListings.map((listing) => (
                      <div 
                        key={listing.id}
                        className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onListingClick?.(listing.id);
                        }}
                      >
                        {listing.images && listing.images[0] && (
                          <img 
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs line-clamp-1">
                            {listing.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {listing.type} • {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}
                          </p>
                          <div className="mt-1">
                            <span className="font-bold text-xs text-green-600">
                              {formatPrice(listing.rentMonthlyEur)}/month
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}