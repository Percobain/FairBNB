/**
 * @fileoverview Add new listing page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { GreenfieldStatus } from '@/components/GreenfieldStatus';
import { create } from '@/lib/services/propertiesService';
import { greenfieldService } from '@/lib/services/greenfieldService';
import { simpleGreenfieldService } from '@/lib/services/greenfieldServiceSimple';
import { useWallet } from '@/lib/hooks/useWallet';
import { ChevronLeft, ChevronRight, Upload, Wallet, Database } from 'lucide-react';

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  propertyType: z.enum(['Apartment', 'Studio', 'PG', 'CoLiving', 'House']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  rentPerMonth: z.number().min(1, 'Rent must be greater than 0'),
  securityDeposit: z.number().min(1, 'Security deposit must be greater than 0'),
  disputeFee: z.number().min(1, 'Dispute fee must be greater than 0'),
  availableFrom: z.string().min(1, 'Available from date is required'),
  minDurationMonths: z.number().min(1, 'Minimum duration is required'),
  maxDurationMonths: z.number().min(1, 'Maximum duration is required')
});

/**
 * Multi-step form for adding new property listing
 */
export function AddListing() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [greenfieldResult, setGreenfieldResult] = useState(null);
  
  // Wallet integration
  const { address, provider, isConnected, isConnecting, connectWallet } = useWallet();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      propertyType: 'Apartment',
      country: 'IN',
      minDurationMonths: 3,
      maxDurationMonths: 12,
      disputeFee: 1000
    }
  });

  const steps = [
    { title: 'Wallet', description: 'Connect your wallet' },
    { title: 'Basics', description: 'Property details and location' },
    { title: 'Pricing', description: 'Rent and deposit information' },
    { title: 'Media', description: 'Photos and images' },
    { title: 'Availability', description: 'Duration and availability' },
    { title: 'Review', description: 'Review and create listing' }
  ];

  // Initialize Greenfield service when wallet connects
  useEffect(() => {
    const initializeGreenfield = async () => {
      if (isConnected && address && provider) {
        try {
          // Try the full SDK first, fallback to simple service
          try {
            await greenfieldService.initialize(address, provider);
            console.log('Full Greenfield service initialized');
          } catch (sdkError) {
            console.warn('SDK failed, using simple service:', sdkError);
            await simpleGreenfieldService.initialize(address, provider);
            console.log('Simple Greenfield service initialized (fallback)');
            toast.warning('Using simplified Greenfield mode due to browser compatibility');
          }
        } catch (error) {
          console.error('Failed to initialize any Greenfield service:', error);
          toast.error('Failed to connect to BNB Greenfield. Please try again.');
        }
      }
    };

    initializeGreenfield();
  }, [isConnected, address, provider]);

  const rentPerMonth = watch('rentPerMonth');

  // Auto-calculate security deposit (2x rent)
  const handleRentChange = (value) => {
    setValue('rentPerMonth', Number(value));
    setValue('securityDeposit', Number(value) * 2);
  };

  const onSubmit = async (data) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsUploading(true);
    
    try {
      // Prepare listing data for Greenfield
      const listingData = {
        ...data,
        photos: photos.length > 0 ? photos : ['/mock-images/property-1.jpg'],
        coverImage: 0,
        amenities: ['Wi-Fi', 'AC', 'Kitchen'] // Mock amenities
      };

      // Upload metadata to BNB Greenfield
      toast.loading('Uploading metadata to BNB Greenfield...', { id: 'upload' });
      
      // Try full service first, fallback to simple service
      let greenfieldResult;
      try {
        greenfieldResult = await greenfieldService.uploadListingMetadata(listingData);
      } catch (sdkError) {
        console.warn('Full SDK upload failed, using simple service:', sdkError);
        greenfieldResult = await simpleGreenfieldService.uploadListingMetadata(listingData);
      }
      
      if (!greenfieldResult.success) {
        throw new Error(greenfieldResult.error || 'Failed to upload to Greenfield');
      }

      setGreenfieldResult(greenfieldResult);
      
      // Create listing with Greenfield metadata URL
      const newListing = create({
        ...listingData,
        greenfieldMetadataUrl: greenfieldResult.metadataUrl,
        greenfieldListingId: greenfieldResult.listingId,
        blockchainOwner: address
      });

      toast.success('Listing created successfully!', {
        id: 'upload',
        description: `Your property metadata is stored on BNB Greenfield (${greenfieldResult.listingId})`
      });

      navigate('/landlord');
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error(error.message || 'Failed to create listing. Please try again.', { id: 'upload' });
    } finally {
      setIsUploading(false);
    }
  };

  const nextStep = () => {
    // Don't allow progressing past wallet step if not connected
    if (currentStep === 0 && !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = () => {
    // Mock photo upload
    const mockPhotos = [
      '/mock-images/property-1.jpg',
      '/mock-images/property-2.jpg',
      '/mock-images/property-3.jpg'
    ];
    setPhotos(mockPhotos);
    toast.success('Photos uploaded (demo)');
  };

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/landlord')}
            className="flex items-center text-nb-ink/70 hover:text-nb-ink mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Add New Listing
          </h1>
          <p className="font-body text-nb-ink/70">
            Create a new property listing to start earning rental income
          </p>
        </div>

        {/* Progress Steps */}
        <NBCard className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full border-2 border-nb-ink flex items-center justify-center ${
                  index <= currentStep ? 'bg-nb-accent' : 'bg-nb-bg'
                }`}>
                  <span className="text-sm font-bold text-nb-ink">{index + 1}</span>
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className="font-medium text-nb-ink">{step.title}</div>
                  <div className="text-xs text-nb-ink/70">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-nb-ink/20 mx-4 hidden sm:block"></div>
                )}
              </div>
            ))}
          </div>
        </NBCard>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <NBCard className="mb-8">
            {currentStep === 0 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Connect Your Wallet
                </h2>
                
                <div className="text-center py-8">
                  <Wallet className="w-16 h-16 text-nb-ink/40 mx-auto mb-4" />
                  
                  {!isConnected ? (
                    <div>
                      <p className="text-nb-ink/70 mb-6">
                        Connect your wallet to store listing metadata on BNB Greenfield
                      </p>
                      <NBButton
                        type="button"
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="mx-auto"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </NBButton>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-4 mb-4">
                        <h3 className="font-medium text-nb-ink mb-2">✅ Wallet Connected</h3>
                        <p className="text-sm text-nb-ink/70 break-all">
                          {address}
                        </p>
                      </div>
                      
                      <div className="bg-blue-100 border-2 border-blue-300 rounded-nb p-4 mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <Database className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="font-medium text-blue-900">BNB Greenfield Ready</h3>
                        </div>
                        <p className="text-sm text-blue-700">
                          Your listing metadata will be stored on BNB Greenfield for decentralized access
                        </p>
                      </div>
                      
                      {/* Greenfield Status Component */}
                      <GreenfieldStatus />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Property Basics
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Property Title *
                  </label>
                  <input
                    {...register('title')}
                    className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                    placeholder="e.g., Cozy Studio near Metro Station"
                  />
                  {errors.title && (
                    <p className="text-nb-error text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Property Type *
                  </label>
                  <select
                    {...register('propertyType')}
                    className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Studio">Studio</option>
                    <option value="PG">PG</option>
                    <option value="CoLiving">Co-Living</option>
                    <option value="House">House</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Address *
                    </label>
                    <input
                      {...register('address')}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="Street address"
                    />
                    {errors.address && (
                      <p className="text-nb-error text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      City *
                    </label>
                    <input
                      {...register('city')}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="City name"
                    />
                    {errors.city && (
                      <p className="text-nb-error text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      State *
                    </label>
                    <input
                      {...register('state')}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="text-nb-error text-sm mt-1">{errors.state.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Country *
                    </label>
                    <select
                      {...register('country')}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                    >
                      <option value="IN">India</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Pincode *
                    </label>
                    <input
                      {...register('pincode')}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="400001"
                    />
                    {errors.pincode && (
                      <p className="text-nb-error text-sm mt-1">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                    placeholder="Describe your property, its features, and what makes it special..."
                  />
                  {errors.description && (
                    <p className="text-nb-error text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Pricing Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Monthly Rent (₹) *
                    </label>
                    <input
                      type="number"
                      {...register('rentPerMonth', { valueAsNumber: true })}
                      onChange={(e) => handleRentChange(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="25000"
                    />
                    {errors.rentPerMonth && (
                      <p className="text-nb-error text-sm mt-1">{errors.rentPerMonth.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Security Deposit (₹) *
                    </label>
                    <input
                      type="number"
                      {...register('securityDeposit', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="50000"
                    />
                    <p className="text-xs text-nb-ink/60 mt-1">
                      Auto-calculated as 2x monthly rent
                    </p>
                    {errors.securityDeposit && (
                      <p className="text-nb-error text-sm mt-1">{errors.securityDeposit.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Dispute Fee (₹) *
                  </label>
                  <input
                    type="number"
                    {...register('disputeFee', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                    placeholder="1000"
                  />
                  <p className="text-xs text-nb-ink/60 mt-1">
                    Fee for dispute resolution (recommended: ₹1000)
                  </p>
                  {errors.disputeFee && (
                    <p className="text-nb-error text-sm mt-1">{errors.disputeFee.message}</p>
                  )}
                </div>

                <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-4">
                  <h3 className="font-medium text-nb-ink mb-2">Payment Information</h3>
                  <p className="text-sm text-nb-ink/70">
                    Payments will be accepted in BNB (demo). All funds are held in escrow until rental completion.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Property Photos
                </h2>
                
                <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center">
                  <Upload className="w-12 h-12 text-nb-ink/40 mx-auto mb-4" />
                  <h3 className="font-medium text-nb-ink mb-2">Upload Photos</h3>
                  <p className="text-sm text-nb-ink/70 mb-4">
                    Add photos to showcase your property (demo)
                  </p>
                  <NBButton type="button" onClick={handlePhotoUpload}>
                    Upload Photos (Demo)
                  </NBButton>
                </div>

                {photos.length > 0 && (
                  <div>
                    <h3 className="font-medium text-nb-ink mb-4">Uploaded Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Property ${index + 1}`}
                            className="w-full h-32 object-cover rounded border-2 border-nb-ink"
                          />
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-nb-accent text-nb-ink text-xs px-2 py-1 rounded border border-nb-ink">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Availability & Duration
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Available From *
                  </label>
                  <input
                    type="date"
                    {...register('availableFrom')}
                    className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                  />
                  {errors.availableFrom && (
                    <p className="text-nb-error text-sm mt-1">{errors.availableFrom.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Minimum Duration (months) *
                    </label>
                    <input
                      type="number"
                      {...register('minDurationMonths', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="3"
                      min="1"
                    />
                    {errors.minDurationMonths && (
                      <p className="text-nb-error text-sm mt-1">{errors.minDurationMonths.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Maximum Duration (months) *
                    </label>
                    <input
                      type="number"
                      {...register('maxDurationMonths', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="12"
                      min="1"
                    />
                    {errors.maxDurationMonths && (
                      <p className="text-nb-error text-sm mt-1">{errors.maxDurationMonths.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Review & Create Listing
                </h2>
                
                <div className="bg-nb-warn/20 border-2 border-nb-warn rounded-nb p-4">
                  <h3 className="font-medium text-nb-ink mb-2">Ready to publish?</h3>
                  <p className="text-sm text-nb-ink/70">
                    Review your listing details and click "Create Listing" to store metadata on BNB Greenfield.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-nb-ink">Wallet & Blockchain</h3>
                    <p className="text-sm text-nb-ink/70">
                      Connected: {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Not connected'}
                    </p>
                    <p className="text-sm text-green-600">
                      ✅ BNB Greenfield ready for metadata storage
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-nb-ink">Property Details</h3>
                    <p className="text-sm text-nb-ink/70">
                      {watch('title')} • {watch('propertyType')} • {watch('city')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-nb-ink">Pricing</h3>
                    <p className="text-sm text-nb-ink/70">
                      ₹{watch('rentPerMonth')?.toLocaleString()}/month • 
                      ₹{watch('securityDeposit')?.toLocaleString()} deposit
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-nb-ink">Duration</h3>
                    <p className="text-sm text-nb-ink/70">
                      {watch('minDurationMonths')}-{watch('maxDurationMonths')} months
                    </p>
                  </div>
                </div>

                {greenfieldResult && (
                  <div className="bg-green-100 border-2 border-green-300 rounded-nb p-4">
                    <h3 className="font-medium text-green-900 mb-2">✅ Metadata Uploaded to BNB Greenfield</h3>
                    <div className="text-sm text-green-700">
                      <p><strong>Listing ID:</strong> {greenfieldResult.listingId}</p>
                      <p><strong>Greenfield URL:</strong> <code className="text-xs">{greenfieldResult.metadataUrl}</code></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </NBCard>

          {/* Navigation */}
          <div className="flex justify-between">
            <NBButton
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </NBButton>

            {currentStep < steps.length - 1 ? (
              <NBButton
                type="button"
                onClick={nextStep}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </NBButton>
            ) : (
              <NBButton 
                type="submit" 
                data-testid="create-listing"
                disabled={isUploading || !isConnected}
              >
                {isUploading ? 'Uploading to Greenfield...' : 'Create Listing'}
              </NBButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
