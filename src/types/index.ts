export type UserRole = 'STUDENT' | 'PRIVATE' | 'ADMIN';

export type ListingType = 'room' | 'studio' | 'apartment';

export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export type VisitRequestStatus = 'NEW' | 'LANDLORD_REPLIED' | 'SCHEDULED' | 'CLOSED';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  university?: University;
  phone: string;
  isVerified: boolean;
}

export interface Landlord {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface University {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  landlord: Landlord;
  title: string;
  titleMultilingual?: { en?: string; it?: string };
  type: ListingType;
  description: string;
  addressLine: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rentMonthlyEur: number;
  depositEur: number;
  landlordAdminFee?: number;
  billsIncluded: boolean;
  furnished: boolean;
  bedrooms: number;
  bathrooms: number;
  totalBedrooms?: number;
  totalBathrooms?: number;
  housematesGender?: 'male' | 'female' | 'mixed';
  floor?: string;
  sizeSqm?: number;
  amenities: string[];
  houseRules?: string[];
  availabilityDate: string;
  images: string[];
  videoUrl?: string;
  createdAt: string;
  publishedAt?: string;
  status: ListingStatus;
  expiresAt?: string;
  distance?: number; // Distance to selected university in km
  bookingEnabled?: boolean;
  instantBooking?: boolean;
  minimumStayDays?: number;
  maximumStayDays?: number;
  advanceBookingDays?: number;
  priceHistory?: any[];
  utilities?: {
    electricity: { included: boolean; cost: number };
    gas: { included: boolean; cost: number };
    water: { included: boolean; cost: number };
    internet: { included: boolean; cost: number };
  };
}

export interface Favorite {
  id: string;
  studentId: string;
  listingId: string;
  createdAt: string;
}

export interface VisitRequest {
  id: string;
  listing: Listing;
  student: StudentProfile;
  message: string;
  status: VisitRequestStatus;
  createdAt: string;
}

export interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  type?: ListingType[];
  bedrooms?: number;
  availabilityDate?: string;
  furnished?: boolean;
  amenities?: string[];
  city?: string;
  universityId?: string;
  radiusKm?: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface ListingAnalytics {
  listingId: string;
  views: number;
  uniqueViews: number;
  favorites: number;
  visitRequests: number;
  daysLive: number;
}