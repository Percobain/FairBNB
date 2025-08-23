/**
 * @fileoverview Property listing details page with blockchain integration
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { Gallery } from '@/components/Gallery';
import { PricingWidget } from '@/components/PricingWidget';
import { ListingDetailsSkeleton } from '@/components/SkeletonLoader';
import { web3Service } from '@/lib/services/web3Service';
import { useAppStore } from '@/lib/stores/useAppStore';
import { MapPin, User, Calendar, Home, Wifi, Car, Shield, Star, Building, ShieldCheck, Tv, Utensils, Waves, TreePine, Dumbbell, Wind, Bath, Bed, Users, Coffee, Gamepad2, Music, Camera, Baby } from 'lucide-react';

/**
 * Property listing details with blockchain data
 */
export function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [property, setProperty] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [rentalDetails, setRentalDetails] = useState(null);
  const [listingDetails, setListingDetails] = useState(null);
  const [isCurrentUserInvolved, setIsCurrentUserInvolved] = useState(false);

  // Realistic mock data generators
  const generateRealisticPhotos = (propertyType, city) => {
    const basePhotos = {
      'Apartment': [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800&h=600&fit=crop'
      ],
      'Studio': [
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop'
      ],
      'House': [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800&h=600&fit=crop'
      ],
      'PG': [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448205-17d3a46c84de?w=800&h=600&fit=crop'
      ],
      'CoLiving': [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571508601793-a2b83b9a4b6b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1543373014-cfe4f4bc1cdf?w=800&h=600&fit=crop'
      ]
    };
    return basePhotos[propertyType] || basePhotos['Apartment'];
  };

  const generateRealisticAmenities = (propertyType) => {
    const amenityPools = {
      'Apartment': {
        basic: ['Wi-Fi', 'AC', 'Kitchen', 'Refrigerator', 'Washing Machine'],
        comfort: ['TV', 'Balcony', 'Wardrobe', 'Study Table', 'Hot Water'],
        premium: ['Parking', 'Security', 'Elevator', 'Power Backup', 'Water Purifier'],
        luxury: ['Gym', 'Swimming Pool', 'Garden', 'CCTV', 'Intercom']
      },
      'Studio': {
        basic: ['Wi-Fi', 'AC', 'Kitchenette', 'Refrigerator', 'Study Area'],
        comfort: ['TV', 'Wardrobe', 'Hot Water', 'Window View'],
        premium: ['Security', 'Power Backup', 'Water Purifier'],
        luxury: ['Gym Access', 'Rooftop', 'CCTV']
      },
      'House': {
        basic: ['Wi-Fi', 'AC', 'Full Kitchen', 'Refrigerator', 'Washing Machine'],
        comfort: ['TV', 'Garden', 'Parking', 'Study Room', 'Hot Water'],
        premium: ['Security System', 'Power Backup', 'Water Purifier', 'Solar Panels'],
        luxury: ['Swimming Pool', 'Home Theater', 'Gym Room', 'Servant Quarter']
      },
      'PG': {
        basic: ['Wi-Fi', 'AC', 'Food Service', 'Laundry', 'Common Kitchen'],
        comfort: ['TV Lounge', 'Study Room', 'Hot Water', 'Cleaning Service'],
        premium: ['Security', 'CCTV', 'Power Backup', 'Water Purifier'],
        luxury: ['Gym', 'Recreation Room', 'Rooftop', 'Mini Library']
      },
      'CoLiving': {
        basic: ['Wi-Fi', 'AC', 'Shared Kitchen', 'Laundry', 'Common Areas'],
        comfort: ['TV Lounge', 'Study Spaces', 'Hot Water', 'Cleaning Service'],
        premium: ['24/7 Security', 'CCTV', 'Power Backup', 'Water Purifier'],
        luxury: ['Gym', 'Swimming Pool', 'Recreation Room', 'Coworking Space', 'Events']
      }
    };

    const typeAmenities = amenityPools[propertyType] || amenityPools['Apartment'];
    const selectedAmenities = [
      ...typeAmenities.basic,
      ...typeAmenities.comfort.slice(0, Math.floor(Math.random() * 3) + 1),
      ...typeAmenities.premium.slice(0, Math.floor(Math.random() * 2) + 1)
    ];

    // Sometimes add luxury amenities
    if (Math.random() > 0.7) {
      selectedAmenities.push(...typeAmenities.luxury.slice(0, Math.floor(Math.random() * 2) + 1));
    }

    return [...new Set(selectedAmenities)]; // Remove duplicates
  };

  const generateRealisticReviews = (propertyType, city) => {
    const reviewTemplates = [
      {
        name: "Priya Sharma",
        rating: 5,
        text: "Excellent property! The landlord is very responsive and the maintenance is top-notch. Great location with easy access to public transport.",
        avatar: "PS"
      },
      {
        name: "Rahul Kumar",
        rating: 4,
        text: "Good value for money. The apartment is well-furnished and the neighborhood is safe. Minor issues with water pressure but overall satisfied.",
        avatar: "RK"
      },
      {
        name: "Anita Gupta",
        rating: 5,
        text: "Loved staying here! Very clean, modern amenities, and great neighbors. The kitchen is fully equipped and perfect for cooking.",
        avatar: "AG"
      },
      {
        name: "Vikram Singh",
        rating: 4,
        text: "Decent place with good connectivity. The security is reliable and parking is convenient. Would recommend to working professionals.",
        avatar: "VS"
      },
      {
        name: "Meera Patel",
        rating: 5,
        text: "Amazing experience! The property exactly matches the photos. Very peaceful area and all promised amenities are available.",
        avatar: "MP"
      },
      {
        name: "Arjun Reddy",
        rating: 4,
        text: "Great for students and young professionals. Good internet speed for work from home. The common areas are well-maintained.",
        avatar: "AR"
      }
    ];

    // Select 3-4 random reviews
    const numReviews = Math.floor(Math.random() * 2) + 3;
    const selectedReviews = reviewTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, numReviews);

    return selectedReviews;
  };

  // Helper function to convert IPFS URL to gateway URL
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop';
    
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    if (ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }
    
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    
    return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop';
  };

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);

        // Check if Web3 is connected
        if (!web3Service.isWeb3Connected()) {
          const initResult = await web3Service.initialize();
          if (!initResult.success) {
            throw new Error(initResult.error);
          }
        }

        // Get token URI and metadata
        const tokenURI = await web3Service.contract.tokenURI(id);
        const metadataResult = await web3Service.getMetadataFromURI(tokenURI);
        
        if (!metadataResult.success) {
          throw new Error('Failed to load property metadata');
        }

        const metadata = metadataResult.metadata;
        const imageUrl = getImageUrl(metadata.image);

        // Get listing details from contract
        const listingResult = await web3Service.contract.getListingDetails(id);
        const rentalResult = await web3Service.contract.getRentalDetails(id);
        
        // Get owner address
        const owner = await web3Service.contract.ownerOf(id);

        // Check if current user is involved in this rental
        const currentAccount = web3Service.getAccount();
        const isInvolved = rentalResult.isActive && 
          (rentalResult.tenant.toLowerCase() === currentAccount.toLowerCase() || 
           rentalResult.landlord.toLowerCase() === currentAccount.toLowerCase());

        setIsCurrentUserInvolved(isInvolved);

        // Generate realistic mock data
        const realisticPhotos = generateRealisticPhotos(metadata.propertyType, metadata.city);
        realisticPhotos[0] = imageUrl; // Keep the original image as first

        const realisticAmenities = generateRealisticAmenities(metadata.propertyType);
        const realisticReviews = generateRealisticReviews(metadata.propertyType, metadata.city);

        const propertyData = {
          id: id,
          tokenId: id,
          title: metadata.name,
          description: metadata.description,
          propertyType: metadata.propertyType,
          address: metadata.address,
          city: metadata.city,
          state: metadata.state,
          country: metadata.country,
          pincode: metadata.pincode,
          rentPerMonth: parseInt(listingResult.rent),
          securityDeposit: parseInt(listingResult.deposit),
          disputeFee: parseInt(listingResult.disputeFee),
          availableFrom: metadata.availableFrom,
          minDurationMonths: metadata.minDurationMonths,
          maxDurationMonths: metadata.maxDurationMonths,
          photos: realisticPhotos,
          coverImage: 0,
          amenities: realisticAmenities,
          reviews: realisticReviews,
          avgRating: (realisticReviews.reduce((acc, review) => acc + review.rating, 0) / realisticReviews.length).toFixed(1),
          totalReviews: realisticReviews.length,
          isListed: listingResult.isListed,
          isRented: rentalResult.isActive,
          isDisputed: rentalResult.isDisputed,
          landlord: owner,
          tenant: rentalResult.tenant,
          createdAt: metadata.createdAt,
          imageUrl: imageUrl,
          metadata: metadata,
          rentalDetails: rentalResult
        };

        setProperty(propertyData);
        setListingDetails(listingResult);
        setRentalDetails(rentalResult);

      } catch (error) {
        console.error('Failed to load property:', error);
        toast.error('Failed to load property details');
        navigate('/tenant');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProperty();
    }
  }, [id, navigate]);

  const handleBooking = async (bookingData) => {
    try {
      if (!web3Service.isWeb3Connected()) {
        const initResult = await web3Service.initialize();
        if (!initResult.success) {
          throw new Error(initResult.error);
        }
      }

      // Calculate total amount to pay
      const totalAmount = property.rentPerMonth + property.securityDeposit + property.disputeFee;

      // Rent the property
      const rentResult = await web3Service.rentProperty(property.tokenId, totalAmount);
      
      if (!rentResult.success) {
        throw new Error(rentResult.error);
      }

      toast.success('Booking confirmed!', {
        description: `Property rented successfully. Transaction: ${rentResult.txnHash.slice(0, 10)}...`
      });

      // Navigate to escrow page or refresh
      window.location.reload();
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  const handleEscrowActions = () => {
    // Navigate to escrow page with the rental ID (which is the token ID)
    navigate(`/tenant/escrow/${property.tokenId}`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'terms', label: 'Terms' },
    { id: 'reviews', label: 'Reviews' }
  ];

  const amenityIcons = {
    'Wi-Fi': Wifi,
    'AC': Wind,
    'Parking': Car,
    'Security': Shield,
    'Kitchen': Utensils,
    'Full Kitchen': Utensils,
    'Kitchenette': Utensils,
    'Common Kitchen': Utensils,
    'Shared Kitchen': Utensils,
    'Washing Machine': Bath,
    'Laundry': Bath,
    'TV': Tv,
    'TV Lounge': Tv,
    'Gym': Dumbbell,
    'Gym Access': Dumbbell,
    'Gym Room': Dumbbell,
    'Swimming Pool': Waves,
    'Pool': Waves,
    'Garden': TreePine,
    'Balcony': Home,
    'Wardrobe': Home,
    'Study Table': Home,
    'Study Room': Home,
    'Study Area': Home,
    'Study Spaces': Home,
    'Hot Water': Bath,
    'Water Purifier': Bath,
    'Power Backup': Home,
    'Elevator': Home,
    'CCTV': Camera,
    'Intercom': Home,
    'Refrigerator': Home,
    'Food Service': Coffee,
    'Food': Coffee,
    'Cleaning Service': Home,
    'Recreation Room': Gamepad2,
    'Common Areas': Users,
    'Common Area': Users,
    'Coworking Space': Home,
    'Events': Music,
    'Home Theater': Tv,
    'Rooftop': Home,
    'Mini Library': Home,
    'Solar Panels': Home,
    'Servant Quarter': Home,
    'Security System': Shield,
    '24/7 Security': Shield,
    'Window View': Home
  };

  if (loading) {
    return <ListingDetailsSkeleton />;
  }

  if (!property) {
    return null;
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-nb-ink/70 mb-4">
            <button onClick={() => navigate('/tenant')} className="hover:text-nb-ink">
              Properties
            </button>
            <span className="mx-2">›</span>
            <span>{property.city}</span>
            <span className="mx-2">›</span>
            <span className="text-nb-ink">{property.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
                {property.title}
              </h1>
              <div className="flex items-center text-nb-ink/70 mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {property.address}, {property.city}, {property.state} {property.pincode}
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-nb-accent text-nb-ink text-sm rounded border border-nb-ink">
                  {property.propertyType}
                </span>
                {property.isListed && !property.isRented && (
                  <span className="px-3 py-1 bg-nb-warn text-nb-ink text-sm rounded border border-nb-ink">
                    Available
                  </span>
                )}
                {property.isRented && (
                  <span className="px-3 py-1 bg-nb-error text-nb-ink text-sm rounded border border-nb-ink">
                    Rented
                  </span>
                )}
                {property.isDisputed && (
                  <span className="px-3 py-1 bg-nb-error text-nb-ink text-sm rounded border border-nb-ink">
                    Disputed
                  </span>
                )}
                <div className="flex items-center text-sm text-nb-ink/70">
                  <Star className="w-4 h-4 mr-1 fill-current text-nb-warn" />
                  {property.avgRating} ({property.totalReviews} reviews)
                </div>
              </div>
            </div>

            {/* Escrow Actions Button */}
            {property.isRented && isCurrentUserInvolved && (
              <div className="mt-4 lg:mt-0">
                <NBButton
                  onClick={handleEscrowActions}
                  size="lg"
                  icon={<ShieldCheck className="w-5 h-5" />}
                  className="bg-nb-accent hover:bg-nb-accent/80"
                >
                  Manage Rental
                </NBButton>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <Gallery images={property.photos} coverIndex={property.coverImage} />

            {/* Rental Status Card - Show when property is rented */}
            {property.isRented && (
              <NBCard className="border-2 border-nb-accent">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-nb-accent border-2 border-nb-ink rounded-nb flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-nb-ink" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-nb-ink">
                      Property is Currently Rented
                    </h3>
                    <p className="text-sm text-nb-ink/70">
                      This property is under an active rental agreement with escrow protection.
                    </p>
                    {isCurrentUserInvolved && (
                      <p className="text-sm text-nb-accent font-medium mt-1">
                        You are involved in this rental agreement.
                      </p>
                    )}
                  </div>
                  {isCurrentUserInvolved && (
                    <NBButton
                      onClick={handleEscrowActions}
                      icon={<ShieldCheck className="w-4 h-4" />}
                    >
                      View Details
                    </NBButton>
                  )}
                </div>
              </NBCard>
            )}

            {/* Landlord Info */}
            <NBCard>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-nb-accent border-2 border-nb-ink rounded-nb flex items-center justify-center">
                  <User className="w-6 h-6 text-nb-ink" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-nb-ink">
                    Hosted by {property.landlord.slice(0, 6)}...{property.landlord.slice(-4)}
                  </h3>
                  <div className="flex items-center text-sm text-nb-ink/70">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>Verified host • Token ID: {property.tokenId}</span>
                  </div>
                </div>
              </div>
            </NBCard>

            {/* Tabs */}
            <NBCard>
              <div className="border-b-2 border-nb-ink/20 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === id
                          ? 'border-nb-accent text-nb-ink'
                          : 'border-transparent text-nb-ink/70 hover:text-nb-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      About this place
                    </h3>
                    <p className="font-body text-nb-ink/80 leading-relaxed">
                      {property.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center space-x-2">
                        <Home className="w-4 h-4 text-nb-ink/60" />
                        <span className="text-sm text-nb-ink">{property.propertyType}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-nb-ink/60" />
                        <span className="text-sm text-nb-ink">Available from {new Date(property.availableFrom).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-nb-ink/60" />
                        <span className="text-sm text-nb-ink">{property.minDurationMonths}-{property.maxDurationMonths} months</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-nb-ink/60" />
                        <span className="text-sm text-nb-ink">Created: {new Date(property.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      What this place offers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.amenities.map((amenity) => {
                        const IconComponent = amenityIcons[amenity] || Home;
                        return (
                          <div key={amenity} className="flex items-center space-x-3 p-3 border border-nb-ink/20 rounded-nb">
                            <IconComponent className="w-5 h-5 text-nb-accent" />
                            <span className="text-nb-ink font-medium">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'terms' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Rental Terms & Conditions
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-nb-ink/20">
                        <span className="text-nb-ink font-medium">Monthly Rent</span>
                        <span className="font-bold text-nb-ink">₹{property.rentPerMonth.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-nb-ink/20">
                        <span className="text-nb-ink font-medium">Security Deposit</span>
                        <span className="font-bold text-nb-ink">₹{property.securityDeposit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-nb-ink/20">
                        <span className="text-nb-ink font-medium">Dispute Fee</span>
                        <span className="font-bold text-nb-ink">₹{property.disputeFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-nb-ink/20">
                        <span className="text-nb-ink font-medium">Minimum Duration</span>
                        <span className="font-bold text-nb-ink">{property.minDurationMonths} months</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-nb-ink/20">
                        <span className="text-nb-ink font-medium">Maximum Duration</span>
                        <span className="font-bold text-nb-ink">{property.maxDurationMonths} months</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-nb-ink/20">
                        <span className="text-nb-ink font-medium">Payment Method</span>
                        <span className="font-bold text-nb-ink">Cryptocurrency (BNB)</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-nb-accent/10 px-4 rounded-nb">
                        <span className="text-nb-ink font-bold">Total Initial Payment</span>
                        <span className="font-bold text-nb-ink text-lg">₹{(property.rentPerMonth + property.securityDeposit + property.disputeFee).toLocaleString()}</span>
                      </div>
                      
                      <div className="mt-6 p-4 bg-nb-bg border border-nb-ink/20 rounded-nb">
                        <h4 className="font-medium text-nb-ink mb-2">Important Notes:</h4>
                        <ul className="text-sm text-nb-ink/70 space-y-1">
                          <li>• Security deposit is fully refundable at the end of the lease</li>
                          <li>• Dispute fee is held in smart contract escrow</li>
                          <li>• All payments are secured by blockchain technology</li>
                          <li>• Rental agreement is automatically enforced by smart contract</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display font-bold text-lg text-nb-ink">
                        Reviews ({property.totalReviews})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 fill-current text-nb-warn" />
                        <span className="font-bold text-nb-ink">{property.avgRating}</span>
                        <span className="text-nb-ink/70">({property.totalReviews} reviews)</span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {property.reviews.map((review, index) => (
                        <div key={index} className="border-b border-nb-ink/20 pb-6 last:border-b-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-nb-accent rounded-full flex items-center justify-center border-2 border-nb-ink">
                              <span className="text-sm font-bold text-nb-ink">{review.avatar}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-nb-ink">{review.name}</h4>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`w-3 h-3 ${star <= review.rating ? 'fill-current text-nb-warn' : 'text-nb-ink/20'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-nb-ink/80 leading-relaxed">
                            {review.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </NBCard>
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:col-span-1">
            <PricingWidget
              rentPerMonth={property.rentPerMonth}
              deposit={property.securityDeposit}
              disputeFee={property.disputeFee}
              onBook={handleBooking}
              disabled={!property.isListed || property.isRented}
            />
          </div>
        </div>
      </div>
    </div>
  );
}