import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedListingCardProps {
  listing: {
    id: string;
    title: string;
    images: string[];
    rent_monthly_eur: number;
    address_line?: string;
    city?: string;
    size_sqm?: number;
    bathrooms?: number;
  };
  formatPrice: (price: number) => string;
  viewDetailsText: string;
}

export const FeaturedListingCard: React.FC<FeaturedListingCardProps> = ({ 
  listing, 
  formatPrice,
  viewDetailsText 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };
  
  return (
    <div className="w-full snap-start">
      <div 
        className="relative aspect-square overflow-hidden rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0);
        }}
      >
        <Link to={`/listing/${listing.id}`} className="block w-full h-full" onClick={() => window.scrollTo(0, 0)}>
          <img 
            src={listing.images[currentImageIndex] || '/placeholder.svg'} 
            alt={listing.title} 
            className="w-full h-full object-cover transition-none" 
            loading="lazy" 
          />
          <div className={`absolute inset-0 bg-black/20 transition-opacity ${isHovered ? 'opacity-0' : ''}`} />
          <div className={`absolute inset-0 flex flex-col justify-between p-6 pointer-events-none transition-opacity ${isHovered ? 'opacity-0' : ''}`}>
            <div>
              <h3 className="text-white text-xl font-bold mb-2 drop-shadow-lg line-clamp-2">
                {listing.title}
              </h3>
            </div>
            <div className="flex items-end justify-between pointer-events-auto">
              <div>
                <div className="text-white text-sm font-medium drop-shadow-lg mb-1.5">
                  {listing.size_sqm && <span>{listing.size_sqm}m²</span>}
                  {listing.size_sqm && listing.bathrooms > 0 && <span> • </span>}
                  {listing.bathrooms > 0 && <span>{listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}</span>}
                </div>
                <span className="text-white text-lg font-bold drop-shadow-lg">
                  {formatPrice(listing.rent_monthly_eur)}
                  <span className="text-xs font-light block">/month</span>
                </span>
              </div>
              <Button size="sm" className="text-xs px-3 py-1 h-8" onClick={(e) => e.preventDefault()}>
                {viewDetailsText}
              </Button>
            </div>
          </div>
        </Link>
        
        {isHovered && listing.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 z-10 transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 z-10 transition-all"
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
