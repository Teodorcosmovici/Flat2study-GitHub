import { University, Listing, Landlord, StudentProfile } from '@/types';

export const universities: University[] = [
  {
    id: '1',
    name: 'Bocconi University',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4406,
    lng: 9.1939
  },
  {
    id: '2',
    name: 'Politecnico di Milano',
    city: 'Milan', 
    country: 'Italy',
    lat: 45.4784,
    lng: 9.2270
  },
  {
    id: '3',
    name: 'Università degli Studi di Milano',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4627,
    lng: 9.1908
  },
  {
    id: '4',
    name: 'Cattolica del Sacro Cuore',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4792,
    lng: 9.1847
  }
];

export const landlords: Landlord[] = [
  {
    id: '1',
    name: 'Milano Student Living',
    phone: '+39 02 1234 5678',
    email: 'billing@milanostudentliving.com'
  },
  {
    id: '2', 
    name: 'Urban Student Homes',
    phone: '+39 02 8765 4321',
    email: 'info@urbanstudenthomes.it'
  }
];

export const mockListings: Listing[] = [
  {
    id: '1',
    landlord: landlords[0],
    title: 'Modern Studio near Bocconi University',
    type: 'studio',
    description: 'Beautiful modern studio apartment just 5 minutes walk from Bocconi University. Fully furnished with high-speed internet, air conditioning, and modern appliances. Perfect for international students.',
    addressLine: 'Via Sarfatti 25',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4396,
    lng: 9.1946,
    rentMonthlyEur: 800,
    depositEur: 1600,
    billsIncluded: true,
    furnished: true,
    bedrooms: 1,
    bathrooms: 1,
    floor: '3rd',
    sizeSqm: 35,
    amenities: ['WiFi', 'Air Conditioning', 'Washing Machine', 'Fully Equipped Kitchen', 'Study Desk'],
    availabilityDate: '2025-01-15',
    images: [
      '/images/listing1-1.jpg',
      '/images/listing1-2.jpg',
      '/images/listing1-3.jpg'
    ],
    createdAt: '2024-01-20T10:00:00Z',
    publishedAt: '2024-01-20T10:00:00Z',
    status: 'PUBLISHED',
    expiresAt: '2025-02-20T10:00:00Z',
    distance: 0.4
  },
  {
    id: '2',
    landlord: landlords[0],
    title: 'Shared Room in Student House - Porta Romana',
    type: 'room',
    description: 'Cozy room in a shared student house with 3 other international students. Great location near public transport with easy access to all Milan universities. Friendly, multicultural environment.',
    addressLine: 'Via Lodi 45',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4542,
    lng: 9.2061,
    rentMonthlyEur: 550,
    depositEur: 1100,
    billsIncluded: false,
    furnished: true,
    bedrooms: 1,
    bathrooms: 2,
    floor: '2nd',
    sizeSqm: 18,
    amenities: ['WiFi', 'Shared Kitchen', 'Laundry Room', 'Study Area', 'Garden'],
    availabilityDate: '2025-02-01',
    images: [
      '/images/listing2-1.jpg',
      '/images/listing2-2.jpg'
    ],
    createdAt: '2024-01-22T14:30:00Z',
    publishedAt: '2024-01-22T14:30:00Z',
    status: 'PUBLISHED',
    expiresAt: '2025-02-22T14:30:00Z',
    distance: 1.8
  },
  {
    id: '3',
    landlord: landlords[1],
    title: 'Luxury 1BR Apartment - Navigli District',
    type: 'apartment',
    description: 'Stunning one-bedroom apartment in the heart of Navigli district. Recently renovated with premium finishes, balcony overlooking the canal, and walking distance to nightlife and restaurants.',
    addressLine: 'Alzaia Naviglio Grande 12',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4498,
    lng: 9.1684,
    rentMonthlyEur: 1200,
    depositEur: 2400,
    billsIncluded: false,
    furnished: true,
    bedrooms: 1,
    bathrooms: 1,
    floor: '4th',
    sizeSqm: 55,
    amenities: ['WiFi', 'Air Conditioning', 'Dishwasher', 'Balcony', 'Premium Location'],
    availabilityDate: '2025-03-01',
    images: [
      '/images/listing3-1.jpg',
      '/images/listing3-2.jpg',
      '/images/listing3-3.jpg',
      '/images/listing3-4.jpg'
    ],
    createdAt: '2024-01-25T09:15:00Z',
    publishedAt: '2024-01-25T09:15:00Z',
    status: 'PUBLISHED',
    expiresAt: '2025-02-25T09:15:00Z',
    distance: 2.3
  },
  {
    id: '4',
    landlord: landlords[1],
    title: 'Student Flat near Politecnico',
    type: 'apartment',
    description: 'Spacious 2-bedroom flat perfect for sharing with another student. Close to Politecnico di Milano campus with excellent transport links. Includes parking space.',
    addressLine: 'Via Bonardi 9',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4781,
    lng: 9.2301,
    rentMonthlyEur: 900,
    depositEur: 1800,
    billsIncluded: true,
    furnished: true,
    bedrooms: 2,
    bathrooms: 1,
    floor: '1st',
    sizeSqm: 70,
    amenities: ['WiFi', 'Parking Space', 'Heating', 'Elevator', 'Near Campus'],
    availabilityDate: '2025-01-20',
    images: [
      '/images/listing4-1.jpg',
      '/images/listing4-2.jpg'
    ],
    createdAt: '2024-01-18T16:45:00Z',
    publishedAt: '2024-01-18T16:45:00Z',
    status: 'PUBLISHED',
    expiresAt: '2025-02-18T16:45:00Z',
    distance: 0.2
  },
  {
    id: '5',
    landlord: landlords[0],
    title: 'Bright Studio - Citta Studi Area',
    type: 'studio',
    description: 'Bright and airy studio apartment in the student-friendly Citta Studi neighborhood. Recently renovated with modern amenities and excellent natural light.',
    addressLine: 'Via Pascoli 15',
    city: 'Milan',
    country: 'Italy',
    lat: 45.4734,
    lng: 9.2363,
    rentMonthlyEur: 700,
    depositEur: 1400,
    billsIncluded: true,
    furnished: true,
    bedrooms: 1,
    bathrooms: 1,
    floor: '5th',
    sizeSqm: 40,
    amenities: ['WiFi', 'Elevator', 'Natural Light', 'Study Corner', 'Near Metro'],
    availabilityDate: '2025-02-15',
    images: [
      '/images/listing5-1.jpg'
    ],
    createdAt: '2024-01-28T11:20:00Z',
    publishedAt: '2024-01-28T11:20:00Z',
    status: 'PUBLISHED',
    expiresAt: '2025-02-28T11:20:00Z',
    distance: 3.1
  }
];

export const mockStudentProfiles: StudentProfile[] = [
  {
    id: '1',
    userId: 'student1',
    fullName: 'Sofia Martinez',
    university: universities[0],
    phone: '+34 612 345 678',
    isVerified: true
  },
  {
    id: '2',
    userId: 'student2', 
    fullName: 'Marco Rossi',
    university: universities[1],
    phone: '+39 345 123 4567',
    isVerified: true
  },
  {
    id: '3',
    userId: 'student3',
    fullName: 'Emma Johnson',
    university: universities[0],
    phone: '+44 7700 123456',
    isVerified: false
  }
];

export const commonAmenities = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Washing Machine',
  'Dishwasher',
  'Fully Equipped Kitchen',
  'Study Desk',
  'Balcony',
  'Parking Space',
  'Elevator',
  'Garden',
  'Gym Access',
  'Concierge',
  'Security'
];