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
  Building
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
            } else {
              throw new Error('Failed to load property metadata');
            }
          } else {
            throw new Error('You are not involved in this rental or it is not active');
          }
        } catch (error) {
          console.error('Failed to load specific rental:', error);
          toast.error('Failed to load rental details');
          navigate('/tenant');
        }
      } else {
        // Load all rented properties (existing logic)
        const allNFTsResult = await web3Service.getAllNFTsWithDetails();
        if (!allNFTsResult.success) {
          throw new Error(allNFTsResult.error);
        }

        const rentedPropertiesData = [];

        for (const nft of allNFTsResult.nfts) {
          try {
            // Get rental details
            const rentalDetails = await web3Service.contract.getRentalDetails(nft.tokenId);
            
            // Check if this property is actively rented and current user is involved
            if (rentalDetails.isActive && 
                (rentalDetails.tenant.toLowerCase() === currentAccount.toLowerCase() || 
                 rentalDetails.landlord.toLowerCase() === currentAccount.toLowerCase())) {
              
              // Get metadata
              const metadataResult = await web3Service.getMetadataFromURI(nft.tokenURI);
              if (metadataResult.success) {
                const imageUrl = getImageUrl(metadataResult.metadata.image);
                
                const property = {
                  tokenId: nft.tokenId,
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

                rentedPropertiesData.push(property);
              }
            }
          } catch (error) {
            console.error(`Failed to process NFT ${nft.tokenId}:`, error);
          }
        }

        setRentedProperties(rentedPropertiesData);
      }

    } catch (error) {
      console.error('Failed to load rented properties:', error);
      toast.error('Failed to load rented properties');
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
      
      const property = rentedProperties.find(p => p.tokenId === tokenId);
      const isLandlord = property.isLandlord;

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
        toast.success('Dispute raised!', {
          description: 'A dispute has been initiated. The jury will review the case.'
        });
        await loadRentedProperties(); // Refresh the data
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
              {processingAction === 'withdraw' ? 'Withdrawing...' : 'Withdraw Funds'}
            </NBButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <NBCard className="p-4">
            <div className="flex items-center">
              <Home className="w-8 h-8 text-nb-accent mr-3" />
              <div>
                <div className="text-2xl font-bold text-nb-ink">{rentedProperties.length}</div>
                <div className="text-sm text-nb-ink/70">Active Rentals</div>
              </div>
            </div>
          </NBCard>
          
          <NBCard className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-nb-warn mr-3" />
              <div>
                <div className="text-2xl font-bold text-nb-ink">
                  {rentedProperties.filter(p => p.tenantHappy || p.landlordHappy).length}
                </div>
                <div className="text-sm text-nb-ink/70">Happy Parties</div>
              </div>
            </div>
          </NBCard>
          
          <NBCard className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-nb-error mr-3" />
              <div>
                <div className="text-2xl font-bold text-nb-ink">
                  {rentedProperties.filter(p => p.isDisputed).length}
                </div>
                <div className="text-sm text-nb-ink/70">Disputes</div>
              </div>
            </div>
          </NBCard>
          
          <NBCard className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-nb-accent mr-3" />
              <div>
                <div className="text-2xl font-bold text-nb-ink">
                  {rentedProperties.filter(p => p.isLandlord).length}
                </div>
                <div className="text-sm text-nb-ink/70">As Landlord</div>
              </div>
            </div>
          </NBCard>
        </div>

        {/* Rented Properties */}
        {rentedProperties.length === 0 ? (
          <NBCard className="text-center py-16">
            <Building className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
            <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
              No active rentals
            </h3>
            <p className="font-body text-nb-ink/70 mb-6">
              You don't have any active rentals yet. Rent a property to see it here.
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
                    <div>
                      <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
                        {property.title}
                      </h3>
                      <p className="text-nb-ink/70 mb-2">{property.city}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded border border-nb-ink ${
                          property.isLandlord ? 'bg-nb-accent text-nb-ink' : 'bg-nb-warn text-nb-ink'
                        }`}>
                          {property.isLandlord ? 'Landlord' : 'Tenant'}
                        </span>
                        {property.isDisputed && (
                          <span className="px-2 py-1 bg-nb-error text-nb-ink text-xs rounded border border-nb-ink">
                            Disputed
                          </span>
                        )}
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
                        <div className="w-full p-3 bg-nb-error/20 border border-nb-error rounded-nb">
                          <p className="text-sm text-nb-ink">
                            ⚠️ This property is under dispute. The jury will review and resolve the case.
                          </p>
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
