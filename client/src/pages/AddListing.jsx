/**
 * @fileoverview Add new listing page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { create } from '@/lib/services/propertiesService';
import { web3Service } from '@/lib/services/web3Service';
import { pinataService } from '@/lib/services/pinataService';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';

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
  maxDurationMonths: z.number().min(1, 'Maximum duration is required'),
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or more').optional(),
  bathrooms: z.number().min(0, 'Bathrooms must be 0 or more').optional(),
  areaSqft: z.number().min(1, 'Area must be greater than 0').optional()
});

/**
 * Multi-step form for adding new property listing
 */
export function AddListing() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false); // Add minting state

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      propertyType: 'Apartment',
      country: 'IN',
      minDurationMonths: 3,
      maxDurationMonths: 12,
      disputeFee: 1000,
      bedrooms: 2,
      bathrooms: 1,
      areaSqft: 1000
    }
  });

  const steps = [
    { title: 'Basics', description: 'Property details and location' },
    { title: 'Pricing', description: 'Rent and deposit information' },
    { title: 'Media', description: 'Photos and images' },
    { title: 'Availability', description: 'Duration and availability' },
    { title: 'Review', description: 'Review and create listing' }
  ];

  const rentPerMonth = watch('rentPerMonth');

  // Auto-calculate security deposit (2x rent)
  const handleRentChange = (value) => {
    setValue('rentPerMonth', Number(value));
    setValue('securityDeposit', Number(value) * 2);
  };

  const handlePhotoUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await pinataService.uploadFile(file, {
          name: file.name,
          metadata: {
            type: 'property-image'
          }
        });
        
        if (result.success) {
          return result.url; // Return IPFS URL
        }
        throw new Error(result.error);
      });

      const ipfsUrls = await Promise.all(uploadPromises);
      setUploadedPhotos(ipfsUrls);
      
      toast.success(`${ipfsUrls.length} photos uploaded to IPFS successfully!`);
    } catch (error) {
      console.error('Failed to upload photos:', error);
      toast.error('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    // Prevent double submission
    if (isMinting) {
      console.log('Already minting, preventing double submission');
      return;
    }

    setIsMinting(true);
    
    try {
      // Convert rent to BNB (assuming 1 BNB = 500,000 INR for demo)
      const rentInBNB = (data.rentPerMonth / 500000).toFixed(6);
      const depositInBNB = (data.securityDeposit / 500000).toFixed(6);
      const disputeFeeInBNB = (data.disputeFee / 500000).toFixed(6);

      // Generate a unique property ID
      const propertyId = Date.now().toString();

      // Prepare NFT metadata matching the contract format
      const metadata = {
        name: `FairBNB Rental - ${data.title}`,
        description: data.description,
        image: uploadedPhotos[0] || '', // Cover image
        external_url: `http://localhost:5173/property/${propertyId}`,
        attributes: [
          { trait_type: 'city', value: data.city },
          { trait_type: 'address', value: data.address },
          { trait_type: 'rent_bnb', value: rentInBNB },
          { trait_type: 'deposit_bnb', value: depositInBNB },
          { trait_type: 'dispute_fee_bnb', value: disputeFeeInBNB },
          { trait_type: 'duration_months', value: `${data.minDurationMonths}-${data.maxDurationMonths}` },
          { trait_type: 'bedrooms', value: data.bedrooms?.toString() || '2' },
          { trait_type: 'bathrooms', value: data.bathrooms?.toString() || '1' },
          { trait_type: 'area_sqft', value: data.areaSqft?.toString() || '1000' },
          { trait_type: 'furnished', value: 'true' },
          { trait_type: 'created_at', value: Date.now().toString() },
          { trait_type: 'property_type', value: data.propertyType } // Add property type
        ],
        media: uploadedPhotos, // All uploaded images
        documents: [], // Can add documents later
        house_rules: 'No smoking, No pets, Quiet hours 10pm-7am',
        amenities: ['WiFi', 'AC', 'Parking'],
        verification: {
          verified: false,
          verification_date: '',
          verifier: ''
        }
      };

      // Mint NFT with metadata on IPFS
      const mintResult = await web3Service.mintRentalNFT(metadata);
      
      if (mintResult.success) {
        toast.success('Property NFT minted successfully on BSC Testnet!', {
          description: `Token ID: ${mintResult.tokenId}`
        });
        
        // Store in local service as well (for demo)
        const newListing = create({
          ...data,
          id: propertyId,
          tokenId: mintResult.tokenId,
          tokenURI: mintResult.tokenURI,
          photos: uploadedPhotos.map(url => pinataService.getGatewayUrl(url)),
          coverImage: 0,
          amenities: ['WiFi', 'AC', 'Parking']
        });

        navigate('/landlord');
      } else {
        throw new Error(mintResult.error);
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      {...register('bedrooms', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="2"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      {...register('bathrooms', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="1"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-nb-ink mb-2">
                      Area (sq ft)
                    </label>
                    <input
                      type="number"
                      {...register('areaSqft', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                      placeholder="1000"
                      min="1"
                    />
                  </div>
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

            {currentStep === 1 && (
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
                    Payments will be accepted in BNB. All funds are held in escrow until rental completion.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Property Photos
                </h2>
                
                <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center">
                  <Upload className="w-12 h-12 text-nb-ink/40 mx-auto mb-4" />
                  <h3 className="font-medium text-nb-ink mb-2">Upload Photos to IPFS</h3>
                  <p className="text-sm text-nb-ink/70 mb-4">
                    Your photos will be stored on IPFS via Pinata
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="photo-upload">
                    <span className="inline-flex items-center justify-center whitespace-nowrap rounded-nb text-sm font-medium transition-all duration-200 ease-out border-2 border-nb-ink shadow-nb hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nb-accent disabled:pointer-events-none disabled:opacity-50 bg-nb-accent text-nb-ink hover:bg-nb-accent/90 h-10 px-4 py-2 cursor-pointer">
                      {isUploading ? 'Uploading...' : 'Select Photos'}
                    </span>
                  </label>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div>
                    <h3 className="font-medium text-nb-ink mb-4">
                      Uploaded Photos ({uploadedPhotos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={pinataService.getGatewayUrl(photo)}
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

            {currentStep === 3 && (
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

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                  Review & Create Listing
                </h2>
                
                <div className="bg-nb-warn/20 border-2 border-nb-warn rounded-nb p-4">
                  <h3 className="font-medium text-nb-ink mb-2">Ready to publish?</h3>
                  <p className="text-sm text-nb-ink/70">
                    Review your listing details and click "Create Listing" to mint your property NFT.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-nb-ink">Property Details</h3>
                    <p className="text-sm text-nb-ink/70">
                      {watch('title')} • {watch('propertyType')} • {watch('city')}
                    </p>
                    <p className="text-sm text-nb-ink/70">
                      {watch('bedrooms')} BR • {watch('bathrooms')} BA • {watch('areaSqft')} sq ft
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
                  
                  <div>
                    <h3 className="font-medium text-nb-ink">Photos</h3>
                    <p className="text-sm text-nb-ink/70">
                      {uploadedPhotos.length} photos uploaded to IPFS
                    </p>
                  </div>
                </div>
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
                disabled={isMinting}
              >
                {isMinting ? 'Minting NFT...' : 'Create Listing'}
              </NBButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
