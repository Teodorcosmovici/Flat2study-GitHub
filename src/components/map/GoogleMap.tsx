import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Listing } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';

interface GoogleMapProps {
  listings: Listing[];
  className?: string;
  onListingClick?: (listingId: string) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ listings, className = '', onListingClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch Google Maps API key with fallback
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('Fetching Google Maps API key...');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        console.log('API key response:', { data, error });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        if (!data?.apiKey) {
          console.error('No API key in response:', data);
          throw new Error('No API key received');
        }
        
        console.log('Successfully received API key from Supabase');
        setApiKey(data.apiKey);
      } catch (err) {
        console.error('Failed to fetch Google Maps API key from Supabase:', err);
        
        // Fallback: Try using a direct API key from configuration
        // Since Google Maps JavaScript API keys are public and meant for client-side use,
        // we can store them directly in the code as a fallback
        const fallbackApiKey = GOOGLE_MAPS_CONFIG.fallbackApiKey;
        
        if (fallbackApiKey && fallbackApiKey.startsWith('AIza')) {
          console.log('Using fallback API key for Google Maps');
          console.log('Fallback API key starts with:', fallbackApiKey.substring(0, 10) + '...');
          setApiKey(fallbackApiKey);
        } else {
          console.error('No valid fallback API key available');
          setError('Google Maps API key not configured. Please add your API key to the fallback or contact support.');
          setIsLoading(false);
        }
      }
    };

    fetchApiKey();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['marker']
        });

        await loader.load();

        // Use configuration for map options
        const mapOptions: google.maps.MapOptions = {
          center: GOOGLE_MAPS_CONFIG.defaultCenter,
          zoom: GOOGLE_MAPS_CONFIG.defaultZoom,
          styles: GOOGLE_MAPS_CONFIG.mapStyles,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        };

        mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize Google Maps:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [apiKey]);

  // Add markers for listings
  useEffect(() => {
    if (!mapInstanceRef.current || !listings.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    listings.forEach((listing) => {
      const position = { lat: listing.lat, lng: listing.lng };

      // Create custom marker with price
      const priceText = `€${Math.round(listing.rentMonthlyEur / 1000)}k`;
      
      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: listing.title,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="56" height="36" rx="18" fill="hsl(221.2 83.2% 53.3%)" stroke="white" stroke-width="4"/>
              <text x="30" y="24" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${priceText}</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(60, 40),
          anchor: new google.maps.Point(30, 20)
        }
      });

      // Create info window content
      const infoWindowContent = `
        <div style="max-width: 300px; padding: 12px;">
          ${listing.images.length > 0 ? `
            <img src="${listing.images[0]}" alt="${listing.title}" 
                 style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
          ` : ''}
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${listing.title}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${listing.addressLine}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 18px; font-weight: bold; color: hsl(221.2 83.2% 53.3%);">€${listing.rentMonthlyEur}/month</span>
            <span style="color: #6b7280; font-size: 14px;">${listing.bedrooms} bed • ${listing.bathrooms} bath</span>
          </div>
          <button onclick="window.handleListingClick('${listing.id}')" 
                  style="width: 100%; padding: 8px 16px; background: hsl(221.2 83.2% 53.3%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            View Details
          </button>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (listings.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current!.getZoom()! > 15) {
          mapInstanceRef.current!.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [listings]);

  // Global function for handling listing clicks from info windows
  useEffect(() => {
    (window as any).handleListingClick = (listingId: string) => {
      if (onListingClick) {
        onListingClick(listingId);
      } else {
        navigate(`/listing/${listingId}`);
      }
    };

    return () => {
      delete (window as any).handleListingClick;
    };
  }, [onListingClick, navigate]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <div className="text-center p-6">
          <p className="text-destructive mb-2 font-medium">Map Unavailable</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <div className="text-xs text-muted-foreground">
            <p>The map requires a valid Google Maps API key.</p>
            <p>You can view listings in grid format instead.</p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-lg ${className}`} />;
};

export default GoogleMap;