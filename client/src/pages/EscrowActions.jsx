/**
 * @fileoverview Escrow actions page for tenants and landlords
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { web3Service } from '@/lib/services/web3Service';
import { 
  Home, 
  User, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Building,
  Upload
} from 'lucide-react';

/**
 * Escrow actions page showing rented properties and available actions
 */
export function EscrowActions() {
  const navigate = useNavigate();
  const { rentalId } = useParams();
  const [rentedProperties, setRentedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  // Helper function to convert IPFS URL to gateway URL
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return '/mock-images/placeholder-property.jpg';
    
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    if (ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }
    
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    
    return '/mock-images/placeholder-property.jpg';
  };

  const loadRentedProperties = async () => {
    try {
      setLoading(true);
      
      // Check if Web3 is connected
      if (!web3Service.isWeb3Connected()) {
        const initResult = await web3Service.initialize();
        if (!initResult.success) {
          throw new Error(initResult.error);
        }
      }

      const currentAccount = web3Service.getAccount();
      
      // If rentalId is provided, load only that specific rental
      if (rentalId) {
        try {
          // Get rental details for the specific property
          const rentalDetails = await web3Service.contract.getRentalDetails(rentalId);
          
          // Check if this property is actively rented and current user is involved
          if (rentalDetails.isActive && 
              (rentalDetails.tenant.toLowerCase() === currentAccount.toLowerCase() || 
               rentalDetails.landlord.toLowerCase() === currentAccount.toLowerCase())) {
            
            // Get token URI and metadata
            const tokenURI = await web3Service.contract.tokenURI(rentalId);
            const metadataResult = await web3Service.getMetadataFromURI(tokenURI);
            
            if (metadataResult.success) {
              const imageUrl = getImageUrl(metadataResult.metadata.image);
              
              const property = {
                tokenId: rentalId,
                title: metadataResult.metadata.name,
                city: metadataResult.metadata.city,
                coverImage: imageUrl,
                rent: parseInt(rentalDetails.rent),
                deposit: parseInt(rentalDetails.deposit),
                disputeFee: parseInt(rentalDetails.disputeFee),
                landlord: rentalDetails.landlord,
                tenant: rentalDetails.tenant,
                tenantHappy: rentalDetails.tenantHappy,
                landlordHappy: rentalDetails.landlordHappy,
                isDisputed: rentalDetails.isDisputed,
                isLandlord: rentalDetails.landlord.toLowerCase() === currentAccount.toLowerCase(),
                metadata: metadataResult.metadata
              };

              setRentedProperties([property]);
            }
          } else {
            setRentedProperties([]);
          }
        } catch (error) {
          console.error('Failed to load specific rental:', error);
          setRentedProperties([]);
        }
      } else {
        // Load all user's rented properties
        const result = await web3Service.getUserNFTs();
        if (result.success) {
          const userRentals = result.nfts.filter(nft => nft.rental.isActive);
          const processedRentals = [];

          for (const nft of userRentals) {
            try {
              const metadataResult = await web3Service.getMetadataFromURI(nft.tokenURI);
              if (metadataResult.success) {
                const imageUrl = getImageUrl(metadataResult.metadata.image);
                
                processedRentals.push({
                  tokenId: nft.tokenId,
                  title: metadataResult.metadata.name,
                  city: metadataResult.metadata.city,
                  coverImage: imageUrl,
                  rent: parseInt(nft.rental.rent),
                  deposit: parseInt(nft.rental.deposit),
                  disputeFee: parseInt(nft.rental.disputeFee),
                  landlord: nft.rental.landlord,
                  tenant: nft.rental.tenant,
                  tenantHappy: nft.rental.tenantHappy,
                  landlordHappy: nft.rental.landlordHappy,
                  isDisputed: nft.rental.isDisputed,
                  isLandlord: nft.rental.landlord.toLowerCase() === currentAccount.toLowerCase(),
                  metadata: metadataResult.metadata
                });
              }
            } catch (error) {
              console.error(`Failed to process rental ${nft.tokenId}:`, error);
            }
          }

          setRentedProperties(processedRentals);
        }
      }
    } catch (error) {
      console.error('Failed to load rented properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRentedProperties();
    setRefreshing(false);
  };

  const handleConfirmHappy = async (tokenId) => {
    try {
      setProcessingAction(tokenId);
      
      // Determine if current user is landlord or tenant
      const property = rentedProperties.find(p => p.tokenId === tokenId);
      const isLandlord = property?.isLandlord || false;
      
      const result = await web3Service.confirmHappy(tokenId, isLandlord);
      
      if (result.success) {
        toast.success('Happiness confirmed!', {
          description: 'Your satisfaction has been recorded on the blockchain.'
        });
        await loadRentedProperties(); // Refresh the data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to confirm happy:', error);
      toast.error('Failed to confirm happiness', {
        description: error.message
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRaiseDispute = async (tokenId) => {
    try {
      setProcessingAction(tokenId);
      
      const result = await web3Service.raiseDispute(tokenId);
      
      if (result.success) {
        toast.success('Dispute raised successfully!', {
          description: 'Now you can upload your case with evidence.'
        });
        
        // Determine user role for the dispute
        const property = rentedProperties.find(p => p.tokenId === tokenId);
        const role = property?.isLandlord ? 'landlord' : 'tenant';
        
        // Redirect to dispute case upload page
        navigate(`/disputes/upload?propertyId=${tokenId}&role=${role}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to raise dispute:', error);
      toast.error('Failed to raise dispute', {
        description: error.message
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUploadCase = (tokenId) => {
    const property = rentedProperties.find(p => p.tokenId === tokenId);
    const role = property?.isLandlord ? 'landlord' : 'tenant';
    navigate(`/disputes/upload?propertyId=${tokenId}&role=${role}`);
  };

  const handleWithdraw = async () => {
    try {
      setProcessingAction('withdraw');
      
      const result = await web3Service.withdraw();
      
      if (result.success) {
        toast.success('Funds withdrawn!', {
          description: 'Your funds have been transferred to your wallet.'
        });
        await loadRentedProperties(); // Refresh the data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
      toast.error('Failed to withdraw funds', {
        description: error.message
      });
    } finally {
      setProcessingAction(null);
    }
  };

  useEffect(() => {
    loadRentedProperties();
  }, [rentalId]); // Add rentalId to dependency array

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading your rentals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/tenant')}
              className="flex items-center text-nb-ink/70 hover:text-nb-ink mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Explore
            </button>
            <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
              My Rentals & Escrow
            </h1>
            <p className="font-body text-nb-ink/70">
              Manage your active rentals and escrow actions
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <NBButton
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </NBButton>
            <NBButton
              onClick={handleWithdraw}
              disabled={processingAction === 'withdraw'}
              icon={<DollarSign className="w-4 h-4" />}
            >
              {processingAction === 'withdraw' ? 'Processing...' : 'Withdraw Funds'}
            </NBButton>
          </div>
        </div>

        {/* Content */}
        {rentedProperties.length === 0 ? (
          <NBCard className="text-center py-16">
            <Building className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
            <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
              No active rentals
            </h3>
            <p className="text-nb-ink/70 mb-6">
              You don't have any active rental agreements at the moment.
            </p>
            <NBButton onClick={() => navigate('/tenant')}>
              Explore Properties
            </NBButton>
          </NBCard>
        ) : (
          <div className="space-y-6">
            {rentedProperties.map((property) => (
              <NBCard key={property.tokenId} className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Property Image */}
                  <div className="lg:w-1/3">
                    <img
                      src={property.coverImage}
                      alt={property.title}
                      className="w-full h-48 object-cover rounded border-2 border-nb-ink"
                      onError={(e) => {
                        e.target.src = '/mock-images/placeholder-property.jpg';
                      }}
                    />
                  </div>

                  {/* Property Details */}
                  <div className="lg:w-2/3 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-xl text-nb-ink mb-1">
                          {property.title}
                        </h3>
                        <p className="text-nb-ink/70 mb-2">{property.city}</p>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-nb-accent text-nb-ink text-xs rounded border border-nb-ink">
                            {property.isLandlord ? 'Landlord' : 'Tenant'}
                          </span>
                          {property.isDisputed && (
                            <span className="px-2 py-1 bg-nb-error text-nb-ink text-xs rounded border border-nb-ink">
                              Disputed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-nb-ink/70">Rent:</span>
                        <div className="font-medium text-nb-ink">₹{property.rent.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-nb-ink/70">Deposit:</span>
                        <div className="font-medium text-nb-ink">₹{property.deposit.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-nb-ink/70">Dispute Fee:</span>
                        <div className="font-medium text-nb-ink">₹{property.disputeFee.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-nb-ink/70">Your Status:</span>
                        {property.isLandlord ? (
                          <span className={`flex items-center space-x-1 ${
                            property.landlordHappy ? 'text-nb-warn' : 'text-nb-ink/50'
                          }`}>
                            {property.landlordHappy ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span>{property.landlordHappy ? 'Happy' : 'Not Confirmed'}</span>
                          </span>
                        ) : (
                          <span className={`flex items-center space-x-1 ${
                            property.tenantHappy ? 'text-nb-warn' : 'text-nb-ink/50'
                          }`}>
                            {property.tenantHappy ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span>{property.tenantHappy ? 'Happy' : 'Not Confirmed'}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-nb-ink/70">Other Party:</span>
                        {property.isLandlord ? (
                          <span className={`flex items-center space-x-1 ${
                            property.tenantHappy ? 'text-nb-warn' : 'text-nb-ink/50'
                          }`}>
                            {property.tenantHappy ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span>{property.tenantHappy ? 'Happy' : 'Not Confirmed'}</span>
                          </span>
                        ) : (
                          <span className={`flex items-center space-x-1 ${
                            property.landlordHappy ? 'text-nb-warn' : 'text-nb-ink/50'
                          }`}>
                            {property.landlordHappy ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span>{property.landlordHappy ? 'Happy' : 'Not Confirmed'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-nb-ink/20">
                      {!property.isDisputed && (
                        <>
                          <NBButton
                            onClick={() => handleConfirmHappy(property.tokenId)}
                            disabled={processingAction === property.tokenId}
                            variant="primary"
                            icon={<CheckCircle className="w-4 h-4" />}
                          >
                            {processingAction === property.tokenId ? 'Processing...' : "I'm Happy"}
                          </NBButton>
                          
                          <NBButton
                            onClick={() => handleRaiseDispute(property.tokenId)}
                            disabled={processingAction === property.tokenId}
                            variant="ghost"
                            icon={<AlertTriangle className="w-4 h-4" />}
                          >
                            {processingAction === property.tokenId ? 'Processing...' : 'Raise Dispute'}
                          </NBButton>
                        </>
                      )}
                      
                      {property.isDisputed && (
                        <div className="w-full space-y-3">
                          <div className="p-3 bg-nb-error/20 border border-nb-error rounded-nb">
                            <p className="text-sm text-nb-ink">
                              ⚠️ This property is under dispute. Upload your case with evidence for the jury to review.
                            </p>
                          </div>
                          <NBButton
                            onClick={() => handleUploadCase(property.tokenId)}
                            variant="primary"
                            icon={<Upload className="w-4 h-4" />}
                            className="bg-nb-error hover:bg-nb-error/80"
                          >
                            Upload Your Case
                          </NBButton>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </NBCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
