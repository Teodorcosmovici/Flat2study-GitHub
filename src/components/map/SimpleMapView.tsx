import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Listing } from '@/types';
import { MILAN_UNIVERSITIES } from '@/data/universities';
import { loadLeafletCSS } from './leaflet-loader';
import './map-styles.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapViewProps {
  listings: Listing[];
  onListingClick?: (listingId: string) => void;
  onListingHover?: (listingId: string | null) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  hoveredListingId?: string | null;
  className?: string;
}

export default function SimpleMapView({ 
  listings, 
  onListingClick,
  onListingHover,
  onBoundsChange,
  hoveredListingId,
  className 
}: SimpleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const initialBoundsSet = useRef(false);
  const currentOpenPopupRef = useRef<L.Marker | null>(null);

  // Stable callback refs to avoid re-rendering markers on every parent re-render
  const onListingClickRef = useRef(onListingClick);
  const onListingHoverRef = useRef(onListingHover);
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => { onListingClickRef.current = onListingClick; }, [onListingClick]);
  useEffect(() => { onListingHoverRef.current = onListingHover; }, [onListingHover]);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  // Memoize grouped listings for performance
  const groupedListings = useMemo(() => {
    const normalizeAddress = (addr?: string) => {
      if (!addr) return '';
      return addr
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[,..;:]/g, ' ') // remove punctuation
        .replace(/\b(it|italy|mi|milano)\b/g, '') // drop country/city suffixes if present
        .replace(/\b(via|v\.|viale|piazza|p\.)\b/g, '') // drop common prefixes
        .replace(/\s+/g, ' ')
        .trim();
    };
    const round = (n: number, p = 6) => Math.round(n * Math.pow(10, p)) / Math.pow(10, p);

    const grouped = listings.reduce((acc, l) => {
      const coordKey = `${round(l.lat, 6)},${round(l.lng, 6)}`;
      const addressKey = normalizeAddress(l.addressLine);
      const key = addressKey ? `${addressKey}|${coordKey}` : coordKey;
      if (!acc[key]) acc[key] = [];
      acc[key].push(l);
      return acc;
    }, {} as Record<string, Listing[]>);

    // Debug logging
    console.log('📍 Map Debug Info:');
    console.log(`Total listings received: ${listings.length}`);
    console.log(`Total marker groups: ${Object.keys(grouped).length}`);
    Object.entries(grouped).forEach(([key, group]) => {
      if (group.length > 5) {
        console.log(`🎯 Large cluster at ${group[0].lat},${group[0].lng}: ${group.length} properties`);
      }
    });

    return grouped;
  }, [listings]);

  // Initialize map only once
  useEffect(() => {
    loadLeafletCSS();
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    }).setView([45.4642, 9.1900], 13);
    
    // Add zoom control with custom position
    L.control.zoom({
      position: 'topleft'
    }).addTo(mapInstanceRef.current);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Add bounds change listener
    mapInstanceRef.current.on('moveend', () => {
      const bounds = mapInstanceRef.current!.getBounds();
      onBoundsChangeRef.current?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    });

    // Add university markers once
    MILAN_UNIVERSITIES.forEach((university) => {
      const universityIcon = L.divIcon({
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

      L.marker([university.lat, university.lng], { icon: universityIcon })
        .addTo(mapInstanceRef.current!)
        .bindTooltip(`
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 13px; color: #dc2626; margin-bottom: 4px;">
              🎓 ${university.shortName}
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              ${university.name}
            </div>
          </div>
        `, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'university-tooltip'
        });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Optimized marker management - only update when necessary
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const currentMarkerIds = new Set(Object.keys(markersRef.current));
    const newMarkerIds = new Set<string>();

    Object.values(groupedListings).forEach((group) => {
      if (group.length === 1) {
        const listing = group[0];
        newMarkerIds.add(listing.id);
        
        const isHovered = hoveredListingId === listing.id;
        const price = formatPrice(listing.rentMonthlyEur);

        // Update or create marker
        let marker = markersRef.current[listing.id];
        
        if (!marker) {
          // Create new marker
          const markerIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${isHovered ? 'white' : '#059669'};
                border: 2px solid ${isHovered ? '#3b82f6' : 'white'};
                border-radius: 8px;
                padding: 4px 8px;
                font-size: 12px;
                font-weight: 600;
                color: ${isHovered ? '#3b82f6' : 'white'};
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
                transition: all 0.2s ease;
                white-space: nowrap;
                text-align: center;
              ">${price}</div>
            `,
            className: 'custom-price-marker',
            iconSize: [60, 20],
            iconAnchor: [30, 10],
          });

          marker = L.marker([listing.lat, listing.lng], { icon: markerIcon })
            .addTo(map)
            .bindTooltip(`
              <div style="min-width: 200px; padding: 8px;">
                <div style="display: flex; align-items: start; gap: 8px;">
                  ${listing.images && listing.images[0] ? 
                    `<img src="${listing.images[0]}" alt="${listing.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />` 
                    : '<div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 6px; flex-shrink: 0;"></div>'
                  }
                  <div style="flex: 1; min-width: 0;">
                    <h4 style="font-weight: 600; font-size: 13px; margin: 0 0 4px 0; line-height: 1.3; color: #111827;">${listing.title}</h4>
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 6px 0;">📍 ${listing.addressLine}</p>
                    <div style="font-weight: bold; font-size: 14px; color: #059669; margin-bottom: 6px;">${price}/month</div>
                    <div style="display: flex; gap: 8px; font-size: 11px; color: #6b7280;">
                      ${listing.bedrooms > 0 ? `<span>🛏️ ${listing.bedrooms}</span>` : ''}
                      ${listing.bathrooms > 0 ? `<span>🚿 ${listing.bathrooms}</span>` : ''}
                      ${listing.sizeSqm ? `<span>📐 ${listing.sizeSqm}m²</span>` : ''}
                      ${listing.furnished ? '<span>🪑 Furnished</span>' : ''}
                    </div>
                  </div>
                </div>
              </div>
            `, {
              permanent: false,
              direction: 'top',
              offset: [0, -15],
              className: 'custom-tooltip',
              opacity: 1
            });

          marker.on('click', () => onListingClickRef.current?.(listing.id));
          marker.on('mouseover', () => {
            onListingHoverRef.current?.(listing.id);
          });
          marker.on('mouseout', () => {
            onListingHoverRef.current?.(null);
            // Explicitly close tooltip on mouseout
            setTimeout(() => marker.closeTooltip(), 10);
          });

          markersRef.current[listing.id] = marker;
        } else {
          // Update existing marker icon if hover state changed
          const newIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${isHovered ? 'white' : '#059669'};
                border: 2px solid ${isHovered ? '#3b82f6' : 'white'};
                border-radius: 8px;
                padding: 4px 8px;
                font-size: 12px;
                font-weight: 600;
                color: ${isHovered ? '#3b82f6' : 'white'};
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
                transition: all 0.2s ease;
                white-space: nowrap;
                text-align: center;
              ">${price}</div>
            `,
            className: 'custom-price-marker',
            iconSize: [60, 20],
            iconAnchor: [30, 10],
          });
          marker.setIcon(newIcon);
        }
      } else {
        // Handle grouped markers
        const groupKey = `group_${group[0].lat}_${group[0].lng}`;
        newMarkerIds.add(groupKey);
        
        const avgLat = group.reduce((sum, l) => sum + l.lat, 0) / group.length;
        const avgLng = group.reduce((sum, l) => sum + l.lng, 0) / group.length;
        const isGroupHovered = hoveredListingId ? group.some(l => l.id === hoveredListingId) : false;

        let groupMarker = markersRef.current[groupKey];
        
        if (!groupMarker) {
          const clusterIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${isGroupHovered ? '#3b82f6' : '#059669'};
                border: 2px solid white;
                border-radius: 50%;
                width: 34px;
                height: 34px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 800;
                color: white;
                transform: ${isGroupHovered ? 'scale(1.1)' : 'scale(1)'};
                transition: transform 0.2s ease;
              ">${group.length}🏠</div>
            `,
            className: 'cluster-marker',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          groupMarker = L.marker([avgLat, avgLng], { icon: clusterIcon }).addTo(map);
          
          // Create interactive popup for group
          const tooltipHtml = `
            <div style="width: 320px; max-height: 260px; overflow-y: auto; padding: 8px;">
              <h3 style="font-weight: 600; font-size: 13px; margin: 0 0 8px 0; text-align: center;">${group.length} Properties at ${group[0].addressLine}</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${group.map((listing) => {
                  const price = formatPrice(listing.rentMonthlyEur);
                  const img = listing.images && listing.images[0]
                    ? `<img src="${listing.images[0]}" alt="${listing.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />`
                    : '<div style="width: 48px; height: 48px; background: #f3f4f6; border-radius: 6px; flex-shrink: 0;"></div>';
                  return `
                    <div data-listing-id="${listing.id}" style="display: flex; align-items: start; gap: 8px; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; background: white; transition: all 0.2s ease;">
                      ${img}
                      <div style="flex: 1; min-width: 0;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap: 8px;">
                          <h4 style="font-weight: 600; font-size: 12px; margin: 0; line-height: 1.3; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${listing.title}</h4>
                          <div style="font-weight: 700; font-size: 12px; color: #059669;">${price}/mo</div>
                        </div>
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${listing.type || ''} ${listing.bedrooms ? `• ${listing.bedrooms} bed${listing.bedrooms !== 1 ? 's' : ''}` : ''}</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;

          groupMarker.bindPopup(tooltipHtml, {
            className: 'group-hover-preview',
            closeButton: false,
            autoClose: false,
            closeOnClick: false,
            maxWidth: 360,
            offset: [0, -18]
          });

          // Hover behavior - close any open popup first
          groupMarker.on('mouseover', () => {
            // Close any previously open popup
            if (currentOpenPopupRef.current && currentOpenPopupRef.current !== groupMarker) {
              currentOpenPopupRef.current.closePopup();
            }
            groupMarker.openPopup();
            currentOpenPopupRef.current = groupMarker;
          });
          
          groupMarker.on('mouseout', (e) => {
            // Check if mouse is leaving to the popup element
            const relatedTarget = (e.originalEvent as MouseEvent).relatedTarget as HTMLElement;
            const popupEl = groupMarker.getPopup()?.getElement();
            
            // Don't close if moving to the popup
            if (popupEl && relatedTarget && popupEl.contains(relatedTarget)) {
              return;
            }
            
            groupMarker.closePopup();
            if (currentOpenPopupRef.current === groupMarker) {
              currentOpenPopupRef.current = null;
            }
          });
          
          // Handle popup events
          groupMarker.on('popupopen', () => {
            const popupEl = groupMarker.getPopup()?.getElement();
            if (!popupEl) return;
            
            const clickHandler = (e: Event) => {
              const target = e.target as HTMLElement;
              const itemEl = target?.closest('[data-listing-id]') as HTMLElement | null;
              if (!itemEl) return;
              e.stopPropagation();
              e.preventDefault();
              const id = itemEl.getAttribute('data-listing-id');
              if (id) {
                onListingClickRef.current?.(id);
                groupMarker.closePopup();
              }
            };

            const mouseleaveHandler = () => {
              groupMarker.closePopup();
              if (currentOpenPopupRef.current === groupMarker) {
                currentOpenPopupRef.current = null;
              }
            };

            popupEl.addEventListener('click', clickHandler);
            popupEl.addEventListener('mouseleave', mouseleaveHandler);
            L.DomEvent.disableClickPropagation(popupEl);
            L.DomEvent.disableScrollPropagation(popupEl);
            (popupEl as any).__clickHandler = clickHandler;
            (popupEl as any).__mouseleaveHandler = mouseleaveHandler;
          });

          groupMarker.on('popupclose', () => {
            const popupEl = groupMarker.getPopup()?.getElement();
            if (popupEl) {
              const clickHandler = (popupEl as any).__clickHandler;
              const mouseleaveHandler = (popupEl as any).__mouseleaveHandler;
              if (clickHandler) popupEl.removeEventListener('click', clickHandler);
              if (mouseleaveHandler) popupEl.removeEventListener('mouseleave', mouseleaveHandler);
            }
            onListingHoverRef.current?.(null);
          });

          markersRef.current[groupKey] = groupMarker;
        } else {
          // Update group marker icon
          const newIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${isGroupHovered ? '#3b82f6' : '#059669'};
                border: 2px solid white;
                border-radius: 50%;
                width: 34px;
                height: 34px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 800;
                color: white;
                transform: ${isGroupHovered ? 'scale(1.1)' : 'scale(1)'};
                transition: transform 0.2s ease;
              ">${group.length}🏠</div>
            `,
            className: 'cluster-marker',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });
          groupMarker.setIcon(newIcon);
        }
      }
    });

    // Remove markers that are no longer needed
    currentMarkerIds.forEach(id => {
      if (!newMarkerIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Set initial bounds only once
    if (Object.keys(markersRef.current).length > 0 && !initialBoundsSet.current) {
      // If there's only one listing, center on it with a specific zoom level
      if (listings.length === 1) {
        map.setView([listings[0].lat, listings[0].lng], 15);
      } else {
        // For multiple listings, fit bounds to show all markers
        const markers = Object.values(markersRef.current);
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
      initialBoundsSet.current = true;
    }
  }, [groupedListings, hoveredListingId, formatPrice]);

  return (
    <div className={className}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
    </div>
  );
}