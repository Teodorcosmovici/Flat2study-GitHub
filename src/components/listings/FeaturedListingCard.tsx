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
  const [showArrows, setShowArrows] = useState(false);
  
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
    <div className="min-w-[400px] w-[400px] flex-shrink-0 snap-start">
      <div 
        className="relative aspect-square overflow-hidden rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
      >
        <Link to={`/listing/${listing.id}`} className="block w-full h-full" onClick={() => window.scrollTo(0, 0)}>
          <img 
            src={listing.images[currentImageIndex] || '/placeholder.svg'} 
            alt={listing.title} 
            className="w-full h-full object-cover" 
            loading="lazy" 
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
            <div>
              <h3 className="text-white text-xl font-bold mb-2 drop-shadow-lg line-clamp-2">
                {listing.title}
              </h3>
            </div>
            <div className="flex items-end justify-between pointer-events-auto">
              <span className="text-white text-lg font-bold drop-shadow-lg">
                {formatPrice(listing.rent_monthly_eur)}
                <span className="text-xs font-light block">/month</span>
              </span>
              <Button size="sm" className="text-xs px-3 py-1 h-8" onClick={(e) => e.preventDefault()}>
                {viewDetailsText}
              </Button>
            </div>
          </div>
        </Link>
        
        {showArrows && listing.images.length > 1 && (
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
