import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Shield, Home, Headphones, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Listing } from '@/types';
import { PaymentSummaryModal } from '@/components/listing/PaymentSummaryModal';

interface ListingSummaryProps {
  listing: Listing;
  checkInDate: Date;
  checkOutDate: Date;
  persons: number;
}

export function ListingSummary({ listing, checkInDate, checkOutDate, persons }: ListingSummaryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  const images = Array.isArray(listing.images) ? listing.images : [];
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDays = () => {
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = calculateDays();
  const isLongTerm = days >= 28; // 4 weeks or more
  
  // Calculate monthly rate for long-term stays
  const monthlyRate = listing.rentMonthlyEur || 0;
  const dailyRate = monthlyRate / 30; // Approximate daily rate
  
  const firstMonthPayment = monthlyRate;
  const serviceFee = Math.round(monthlyRate * 0.4); // 40% service fee
  const total = firstMonthPayment + serviceFee;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-6">
      {/* Property Images */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex]}
                  alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Image dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Home className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Badge */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                Best Price Guarantee
              </Badge>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-lg line-clamp-2">{listing.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">ROOM</p>
          </div>
        </CardContent>
      </Card>

      {/* Check-in/Check-out Dates */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">MOVE IN</p>
              <p className="font-medium">{format(checkInDate, 'dd-MMM-yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MOVE OUT</p>
              <p className="font-medium">{format(checkOutDate, 'dd-MMM-yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Details */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total to pay when the reservation is accepted</span>
              <span className="font-bold text-lg">{formatPrice(total)}</span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Includes one month rent in advance and the Flat2study fee.
            </p>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>First rental payment</span>
                <span>{formatPrice(firstMonthPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>One-time service fee</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You will be charged if, and only if, the landlord approves your request.
              </p>
              
              <PaymentSummaryModal
                rentMonthlyEur={monthlyRate}
                depositEur={listing.depositEur}
                landlordAdminFee={listing.landlordAdminFee}
                utilities={listing.utilities}
                selectedDates={{
                  checkIn: checkInDate,
                  checkOut: checkOutDate,
                  persons
                }}
              >
                <Button variant="link" className="h-auto p-0 text-primary">
                  Review price details <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </PaymentSummaryModal>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Book with Flat2study */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">With flat2study</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Safe arrival</h4>
                <p className="text-xs text-muted-foreground">
                  If your property isn't as listed, report it within 24 hours of your move-in. 
                  We'll freeze your payment and help resolve the issue fast.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Stress-free housing</h4>
                <p className="text-xs text-muted-foreground">
                  Book your stay online effortlessly with Flat2study from anywhere in the world.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Headphones className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Full support</h4>
                <p className="text-xs text-muted-foreground">
                  We're here for you every step of the way, from booking through to check-out.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}