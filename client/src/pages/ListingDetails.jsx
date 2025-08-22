/**
 * @fileoverview Property listing details page
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { Gallery } from '@/components/Gallery';
import { PricingWidget } from '@/components/PricingWidget';
import { getById } from '@/lib/services/propertiesService';
import { createBooking } from '@/lib/services/rentalsService';
import { useAppStore } from '@/lib/stores/useAppStore';
import { MapPin, User, Calendar, Home, Wifi, Car, Shield, Star } from 'lucide-react';

/**
 * Property listing details with booking functionality
 */
export function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [property, setProperty] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const propertyData = getById(id);
        if (!propertyData) {
          toast.error('Property not found');
          navigate('/tenant');
          return;
        }
        setProperty(propertyData);
      } catch (error) {
        console.error('Failed to load property:', error);
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProperty();
    }
  }, [id, navigate]);

  const handleBooking = (bookingData) => {
    try {
      const rental = createBooking({
        propertyId: property.id,
        tenantId: currentUser.id,
        durationMonths: bookingData.durationMonths,
        startDate: new Date().toISOString()
      });

      toast.success('Booking confirmed! (Demo)', {
        description: 'Funds locked in escrow. Rental agreement created.'
      });

      // Navigate to escrow page
      navigate(`/tenant/escrow/${rental.id}`);
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'terms', label: 'Terms' },
    { id: 'reviews', label: 'Reviews' }
  ];

  const amenityIcons = {
    'Wi-Fi': Wifi,
    'AC': Home,
    'Parking': Car,
    'Security': Shield,
    'Kitchen': Home,
    'Washer': Home,
    'Gym': Home,
    'Pool': Home,
    'Garden': Home,
    'Balcony': Home
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading property...</div>
      </div>
    );
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
                <div className="flex items-center text-sm text-nb-ink/70">
                  <Star className="w-4 h-4 mr-1 fill-current text-nb-warn" />
                  4.8 (24 reviews)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <Gallery images={property.photos} coverIndex={property.coverImage} />

            {/* Landlord Info */}
            <NBCard>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-nb-accent border-2 border-nb-ink rounded-nb flex items-center justify-center">
                  <User className="w-6 h-6 text-nb-ink" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-nb-ink">
                    Hosted by Demo Landlord
                  </h3>
                  <div className="flex items-center text-sm text-nb-ink/70">
                    <span>Verified host • Joined 2023</span>
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
                    </div>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      What this place offers
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.amenities.map((amenity) => {
                        const IconComponent = amenityIcons[amenity] || Home;
                        return (
                          <div key={amenity} className="flex items-center space-x-3">
                            <IconComponent className="w-5 h-5 text-nb-ink/60" />
                            <span className="text-nb-ink">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'terms' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Rental Terms
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-nb-ink">Monthly Rent</span>
                        <span className="font-medium text-nb-ink">₹{property.rentPerMonth.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-nb-ink">Security Deposit</span>
                        <span className="font-medium text-nb-ink">₹{property.securityDeposit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-nb-ink">Dispute Fee</span>
                        <span className="font-medium text-nb-ink">₹{property.disputeFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-nb-ink">Minimum Duration</span>
                        <span className="font-medium text-nb-ink">{property.minDurationMonths} months</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-nb-ink">Maximum Duration</span>
                        <span className="font-medium text-nb-ink">{property.maxDurationMonths} months</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-nb-ink">Accepted Payment</span>
                        <span className="font-medium text-nb-ink">BNB (Demo)</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Reviews (Demo)
                    </h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map((review) => (
                        <div key={review} className="border-b border-nb-ink/20 pb-4 last:border-b-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-nb-accent rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-nb-ink">U</span>
                            </div>
                            <span className="font-medium text-nb-ink">Demo User {review}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-3 h-3 fill-current text-nb-warn" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-nb-ink/80">
                            Great place to stay! Clean, well-maintained, and the landlord was very responsive.
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
