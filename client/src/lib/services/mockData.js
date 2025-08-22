/**
 * @fileoverview Deterministic mock data generation for FairBNB
 * Seeded with 'fairbnb' for consistent data across sessions
 */

// Simple seeded random number generator for deterministic data
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  choice(array) {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// Convert string to seed number
function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

const rng = new SeededRandom(stringToSeed('fairbnb'));

const cities = ['Mumbai', 'Delhi', 'Bangalore'];
const propertyTypes = ['Apartment', 'Studio', 'PG', 'CoLiving', 'House'];
const amenities = ['Wi-Fi', 'AC', 'Washer', 'Kitchen', 'Parking', 'Security', 'Gym', 'Pool', 'Garden', 'Balcony'];

const addresses = [
  '221B Baker Street', '42 Wallaby Way', '123 Main Street', '456 Oak Avenue', 
  '789 Pine Road', '101 Elm Street', '202 Maple Drive', '303 Cedar Lane',
  '404 Birch Boulevard', '505 Ash Street', '606 Willow Way', '707 Cherry Lane'
];

const names = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
  'Anita Reddy', 'Rohit Jain', 'Kavya Nair', 'Arjun Mehta', 'Divya Agarwal'
];

const mockImages = [
  '/mock-images/property-1.jpg', '/mock-images/property-2.jpg', '/mock-images/property-3.jpg',
  '/mock-images/property-4.jpg', '/mock-images/property-5.jpg', '/mock-images/property-6.jpg',
  '/mock-images/property-7.jpg', '/mock-images/property-8.jpg', '/mock-images/property-9.jpg'
];

// Generate users
export const mockUsers = Array.from({ length: 15 }, (_, i) => ({
  id: `user_${String(i + 1).padStart(3, '0')}`,
  role: i < 5 ? 'landlord' : i < 12 ? 'tenant' : 'jury',
  name: rng.choice(names),
  avatarUrl: `/mock-images/avatar-${(i % 6) + 1}.jpg`
}));

// Generate properties
export const mockProperties = Array.from({ length: 12 }, (_, i) => {
  const id = `prop_${String(i + 1).padStart(3, '0')}`;
  const ownerId = `user_${String(rng.nextInt(1, 5)).padStart(3, '0')}`; // First 5 users are landlords
  const propertyType = rng.choice(propertyTypes);
  const city = rng.choice(cities);
  const baseRent = rng.nextInt(15000, 50000);
  const numAmenities = rng.nextInt(3, 6);
  const selectedAmenities = [];
  
  for (let j = 0; j < numAmenities; j++) {
    const amenity = rng.choice(amenities);
    if (!selectedAmenities.includes(amenity)) {
      selectedAmenities.push(amenity);
    }
  }
  
  const numPhotos = rng.nextInt(2, 4);
  const photos = Array.from({ length: numPhotos }, () => rng.choice(mockImages));
  
  return {
    id,
    ownerId,
    title: `${rng.choice(['Cozy', 'Modern', 'Spacious', 'Sunny', 'Luxury'])} ${propertyType} ${rng.choice(['near Metro', 'in City Center', 'with Garden', 'Downtown', 'by the Park'])}`,
    propertyType,
    address: rng.choice(addresses),
    city,
    state: city === 'Mumbai' ? 'MH' : city === 'Delhi' ? 'DL' : 'KA',
    country: 'IN',
    pincode: `${rng.nextInt(100000, 999999)}`,
    description: `A beautiful ${propertyType.toLowerCase()} perfect for ${rng.choice(['professionals', 'students', 'families', 'young couples'])}. ${rng.choice(['Great location', 'Excellent connectivity', 'Peaceful environment', 'Modern amenities'])}.`,
    amenities: selectedAmenities,
    rentPerMonth: baseRent,
    securityDeposit: baseRent * 2,
    disputeFee: Math.floor(baseRent * 0.05),
    acceptedTokens: ['BNB'],
    availableFrom: new Date(2025, rng.nextInt(0, 11), rng.nextInt(1, 28)).toISOString().split('T')[0],
    minDurationMonths: rng.nextInt(3, 6),
    maxDurationMonths: rng.nextInt(12, 24),
    photos,
    coverImage: 0
  };
});

// Generate rentals
export const mockRentals = Array.from({ length: 8 }, (_, i) => {
  const id = `rent_${String(i + 1).padStart(3, '0')}`;
  const propertyId = `prop_${String(rng.nextInt(1, 12)).padStart(3, '0')}`;
  const landlordId = `user_${String(rng.nextInt(1, 5)).padStart(3, '0')}`;
  const tenantId = `user_${String(rng.nextInt(6, 12)).padStart(3, '0')}`;
  const statuses = ['initiated', 'active', 'completed', 'disputed', 'resolved'];
  
  return {
    id,
    propertyId,
    landlordId,
    tenantId,
    startDate: new Date(2025, rng.nextInt(0, 6), rng.nextInt(1, 28)).toISOString(),
    durationMonths: rng.nextInt(6, 18),
    status: rng.choice(statuses)
  };
});

// Generate disputes
export const mockDisputes = Array.from({ length: 5 }, (_, i) => {
  const id = `disp_${String(i + 1).padStart(3, '0')}`;
  const rentalId = `rent_${String(rng.nextInt(1, 8)).padStart(3, '0')}`;
  const raisedBy = rng.choice(['tenant', 'landlord']);
  const statuses = ['raised', 'under_review', 'voting', 'resolved'];
  const status = rng.choice(statuses);
  
  const disputeTitles = [
    'AC not working properly',
    'Water leakage in bathroom',
    'Noise complaints from neighbors',
    'Damaged furniture upon arrival',
    'Internet connectivity issues',
    'Parking space unavailable',
    'Security deposit dispute'
  ];
  
  const tenantClaims = [
    'The air conditioning system failed during the first week of stay and despite multiple requests, the landlord did not arrange for timely repairs.',
    'There is significant water leakage in the bathroom that has caused damage to personal belongings and creates unhygienic conditions.',
    'Continuous noise from construction work was not disclosed before signing the agreement, making it impossible to work from home.',
    'Several pieces of furniture were already damaged when I moved in, but this was not documented in the initial inspection.',
    'The promised high-speed internet connection is extremely slow and frequently disconnects, affecting my work.'
  ];
  
  const landlordResponses = [
    'A qualified technician was scheduled within 48 hours of the complaint, but the tenant denied access on two separate occasions.',
    'The issue was reported immediately to building maintenance and temporary arrangements were offered, which the tenant refused.',
    'The construction work is city-approved infrastructure development that was communicated to all residents well in advance.',
    'A thorough inspection was conducted with the tenant present, and all existing conditions were properly documented and acknowledged.',
    'The internet service meets the specified requirements, and any issues should be reported directly to the service provider.'
  ];
  
  return {
    id,
    rentalId,
    raisedBy,
    title: rng.choice(disputeTitles),
    claimSummary: rng.choice(tenantClaims).substring(0, 100) + '...',
    tenantStatement: rng.choice(tenantClaims),
    landlordStatement: rng.choice(landlordResponses),
    tenantEvidence: [`/mock-images/evidence-${i + 1}-1.jpg`, `/mock-images/evidence-${i + 1}-2.jpg`],
    landlordEvidence: [`/mock-images/evidence-${i + 1}-response.jpg`],
    status,
    deadline: new Date(Date.now() + rng.nextInt(1, 7) * 24 * 60 * 60 * 1000).toISOString(),
    result: status === 'resolved' ? {
      winner: rng.choice(['tenant', 'landlord', 'none']),
      distributedFees: rng.nextInt(500, 2000)
    } : null
  };
});

// Export data for easy access
export const MOCK_DATA = {
  users: mockUsers,
  properties: mockProperties,
  rentals: mockRentals,
  disputes: mockDisputes
};
