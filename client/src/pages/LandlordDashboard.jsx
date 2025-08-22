/**
 * @fileoverview Landlord dashboard page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { StatPill } from '@/components/StatPill';
import { ListingCard } from '@/components/ListingCard';
import { useAppStore } from '@/lib/stores/useAppStore';
import { web3Service } from '@/lib/services/web3Service';
import { pinataService } from '@/lib/services/pinataService';
import { getStatsForLandlord } from '@/lib/services/rentalsService';
import { Plus, Building, DollarSign, AlertTriangle, Grid, List } from 'lucide-react';

/**
 * Landlord dashboard showing owned properties and stats
 */
export function LandlordDashboard() {
  const { currentUser } = useAppStore();
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, disputed: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize Web3 if not already connected
        if (!web3Service.isWeb3Connected()) {
          const initResult = await web3Service.initialize();
          if (!initResult.success) {
            console.error('Failed to initialize Web3:', initResult.error);
            setLoading(false);
            return;
          }
        }

        // Load NFTs from contract
        const nftResult = await web3Service.getUserNFTs();
        
        if (nftResult.success && nftResult.nfts.length > 0) {
          // Convert NFT data to property format
          const nftProperties = nftResult.nfts.map((nft, index) => {
            const metadata = nft.metadata;
            const attributes = metadata.attributes || [];
            
            // Extract attributes
            const getAttr = (trait) => {
              const attr = attributes.find(a => a.trait_type === trait);
              return attr ? attr.value : '';
            };
            
            // Get cover image URL
            let coverImage = metadata.image || '/mock-images/property-1.jpg';
            if (coverImage.startsWith('ipfs://')) {
              coverImage = pinataService.getGatewayUrl(coverImage);
            }
            
            // Get all media URLs
            const photos = (metadata.media || []).map(url => 
              url.startsWith('ipfs://') ? pinataService.getGatewayUrl(url) : url
            );
            
            return {
              id: `nft-${nft.tokenId}`,
              tokenId: nft.tokenId,
              title: metadata.name.replace('FairBNB Rental - ', ''),
              description: metadata.description,
              city: getAttr('city'),
              address: getAttr('address'),
              rentPerMonth: parseFloat(getAttr('rent_bnb')) * 500000, // Convert BNB to INR
              securityDeposit: parseFloat(getAttr('deposit_bnb')) * 500000,
              disputeFee: parseFloat(getAttr('dispute_fee_bnb')) * 500000,
              bedrooms: parseInt(getAttr('bedrooms')) || 2,
              bathrooms: parseInt(getAttr('bathrooms')) || 1,
              areaSqft: parseInt(getAttr('area_sqft')) || 1000,
              coverImage: coverImage,
              photos: photos.length > 0 ? photos : [coverImage],
              status: 'Available',
              amenities: metadata.amenities || [],
              houseRules: metadata.house_rules || '',
              isNFT: true
            };
          });
          
          setProperties(nftProperties);
          setStats({
            total: nftProperties.length,
            active: 0,
            completed: 0,
            disputed: 0
          });
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error('Failed to load landlord data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleViewListing = (id) => {
    // Navigate to listing details (tenant view)
    window.open(`/tenant/listing/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading NFT properties from BSC Testnet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
              Landlord Dashboard
            </h1>
            <p className="font-body text-nb-ink/70">
              Manage your property NFTs on BSC Testnet
            </p>
          </div>
          <Link to="/landlord/new">
            <NBButton
              size="lg"
              icon={<Plus className="w-5 h-5" />}
              data-testid="add-listing"
            >
              Add Listing
            </NBButton>
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatPill
            label="Total NFTs"
            value={properties.length}
            icon={<Building className="w-6 h-6" />}
          />
          <StatPill
            label="Active Rentals"
            value={stats.active}
            icon={<DollarSign className="w-6 h-6" />}
          />
          <StatPill
            label="Completed"
            value={stats.completed}
            icon={<Building className="w-6 h-6" />}
          />
          <StatPill
            label="Disputes"
            value={stats.disputed}
            icon={<AlertTriangle className="w-6 h-6" />}
          />
        </div>

        {/* Listings Section */}
        <NBCard className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="font-display font-bold text-xl text-nb-ink mb-4 sm:mb-0">
              Your Property NFTs ({properties.length})
            </h2>
            <div className="flex items-center space-x-2">
              <NBButton
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                icon={<Grid className="w-4 h-4" />}
              >
                Grid
              </NBButton>
              <NBButton
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={<List className="w-4 h-4" />}
              >
                List
              </NBButton>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                No NFT listings yet
              </h3>
              <p className="font-body text-nb-ink/70 mb-6">
                Create your first property NFT to start earning rental income
              </p>
              <Link to="/landlord/new">
                <NBButton
                  icon={<Plus className="w-4 h-4" />}
                  data-testid="add-first-listing"
                >
                  Mint Your First Property NFT
                </NBButton>
              </Link>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {properties.map((property) => (
                viewMode === 'grid' ? (
                  <ListingCard
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    city={property.city}
                    rentPerMonth={property.rentPerMonth}
                    deposit={property.securityDeposit}
                    coverImage={property.coverImage}
                    badges={[property.status, `NFT #${property.tokenId}`]}
                    onView={handleViewListing}
                  />
                ) : (
                  <NBCard key={property.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={property.coverImage}
                        alt={property.title}
                        className="w-16 h-16 object-cover rounded border-2 border-nb-ink"
                        onError={(e) => {
                          e.target.src = '/mock-images/placeholder-property.jpg';
                        }}
                      />
                      <div>
                        <h3 className="font-display font-bold text-lg text-nb-ink">
                          {property.title}
                        </h3>
                        <p className="font-body text-nb-ink/70">
                          {property.city} • ₹{property.rentPerMonth.toLocaleString()}/month • NFT #{property.tokenId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-nb-accent text-nb-ink text-xs rounded border border-nb-ink">
                        {property.status}
                      </span>
                      <NBButton
                        size="sm"
                        onClick={() => handleViewListing(property.id)}
                      >
                        View
                      </NBButton>
                    </div>
                  </NBCard>
                )
              ))}
            </div>
          )}
        </NBCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NBCard>
            <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link to="/landlord/new">
                <NBButton variant="ghost" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Mint New Property NFT
                </NBButton>
              </Link>
              <NBButton variant="ghost" className="w-full justify-start" disabled>
                <Building className="w-4 h-4 mr-2" />
                Manage Properties
              </NBButton>
              <NBButton variant="ghost" className="w-full justify-start" disabled>
                <DollarSign className="w-4 h-4 mr-2" />
                View Earnings
              </NBButton>
            </div>
          </NBCard>

          <NBCard>
            <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-nb-ink/70">Connected to BSC Testnet</span>
                <span className="text-nb-ink/50">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-nb-ink/70">NFTs minted</span>
                <span className="text-nb-ink/50">{properties.length}</span>
              </div>
            </div>
          </NBCard>
        </div>
      </div>
    </div>
  );
}
