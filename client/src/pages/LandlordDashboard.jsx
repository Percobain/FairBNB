/**
 * @fileoverview Landlord dashboard page with blockchain integration
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { StatPill } from '@/components/StatPill';
import { ListingCard } from '@/components/ListingCard';
import { DashboardStatsSkeleton, ListingCardSkeleton, Skeleton } from '@/components/SkeletonLoader';
import { web3Service } from '@/lib/services/web3Service';
import { Plus, Building, DollarSign, AlertTriangle, Grid, List, RefreshCw } from 'lucide-react';

/**
 * Landlord dashboard showing owned properties from blockchain
 */
export function LandlordDashboard() {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, disputed: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to convert IPFS URL to gateway URL
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return '/mock-images/placeholder-property.jpg';
    
    // Convert ipfs:// to https://gateway.pinata.cloud/ipfs/
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    // If it's already a gateway URL, return as is
    if (ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }
    
    // If it's just a hash, add the gateway prefix
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    
    return '/mock-images/placeholder-property.jpg';
  };

  const loadUserNFTs = async () => {
    try {
      setLoading(true);
      
      // Check if Web3 is connected
      if (!web3Service.isWeb3Connected()) {
        const initResult = await web3Service.initialize();
        if (!initResult.success) {
          throw new Error(initResult.error);
        }
      }

      // Get user's NFTs from blockchain
      const result = await web3Service.getUserNFTs();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Process NFTs and fetch metadata
      const processedProperties = [];
      for (const nft of result.nfts) {
        try {
          const metadataResult = await web3Service.getMetadataFromURI(nft.tokenURI);
          if (metadataResult.success) {
            const imageUrl = getImageUrl(metadataResult.metadata.image);
            
            processedProperties.push({
              id: nft.tokenId,
              tokenId: nft.tokenId,
              title: metadataResult.metadata.name,
              city: metadataResult.metadata.city,
              rentPerMonth: parseInt(nft.listing.rent),
              securityDeposit: parseInt(nft.listing.deposit),
              coverImage: imageUrl,
              status: nft.listing.isListed ? 'Listed' : 'Not Listed',
              isListed: nft.listing.isListed,
              isRented: nft.rental.isActive,
              isDisputed: nft.rental.isDisputed,
              metadata: metadataResult.metadata,
              listing: nft.listing,
              rental: nft.rental
            });
          }
        } catch (error) {
          console.error(`Failed to process NFT ${nft.tokenId}:`, error);
          // Add a placeholder property for failed NFTs
          processedProperties.push({
            id: nft.tokenId,
            tokenId: nft.tokenId,
            title: `Property #${nft.tokenId}`,
            city: 'Unknown',
            rentPerMonth: parseInt(nft.listing.rent) || 0,
            securityDeposit: parseInt(nft.listing.deposit) || 0,
            coverImage: '/mock-images/placeholder-property.jpg',
            status: nft.listing.isListed ? 'Listed' : 'Not Listed',
            isListed: nft.listing.isListed,
            isRented: nft.rental.isActive,
            isDisputed: nft.rental.isDisputed,
            metadata: null,
            listing: nft.listing,
            rental: nft.rental,
            error: true
          });
        }
      }

      setProperties(processedProperties);

      // Calculate stats
      const activeRentals = processedProperties.filter(p => p.isRented).length;
      const disputedRentals = processedProperties.filter(p => p.isDisputed).length;
      const completedRentals = processedProperties.filter(p => !p.isRented && p.rental.tenant !== '0x0000000000000000000000000000000000000000').length;

      setStats({
        total: processedProperties.length,
        active: activeRentals,
        completed: completedRentals,
        disputed: disputedRentals
      });

    } catch (error) {
      console.error('Failed to load user NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserNFTs();
    setRefreshing(false);
  };

  useEffect(() => {
    loadUserNFTs();
  }, []);

  const handleViewListing = (id) => {
    // Navigate to listing details (tenant view)
    window.open(`/tenant/listing/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>

          {/* Stats Skeleton */}
          <DashboardStatsSkeleton />

          {/* Listings Section Skeleton */}
          <NBCard className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <Skeleton className="h-7 w-48 mb-4 sm:mb-0" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>

            {/* Properties Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          </NBCard>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NBCard>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </NBCard>

            <NBCard>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </NBCard>
          </div>
        </div>
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
              Manage your blockchain properties and track rental performance
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
        </div>

        {/* Stats Strip */}
        {refreshing ? (
          <DashboardStatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatPill
              label="Total Properties"
              value={stats.total}
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
        )}

        {/* Listings Section */}
        <NBCard className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="font-display font-bold text-xl text-nb-ink mb-4 sm:mb-0">
              Your Properties ({properties.length})
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

          {refreshing ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {Array.from({ length: viewMode === 'grid' ? 6 : 4 }).map((_, i) => (
                viewMode === 'grid' ? (
                  <ListingCardSkeleton key={i} />
                ) : (
                  <NBCard key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-16 h-16 rounded" />
                      <div>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </NBCard>
                )
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                No properties yet
              </h3>
              <p className="font-body text-nb-ink/70 mb-6">
                Create your first property NFT to start earning rental income
              </p>
              <Link to="/landlord/new">
                <NBButton
                  icon={<Plus className="w-4 h-4" />}
                  data-testid="add-first-listing"
                >
                  Add Your First Property
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
                    badges={[
                      property.status,
                      property.isRented ? 'Rented' : 'Available',
                      property.isDisputed ? 'Disputed' : null
                    ].filter(Boolean)}
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
                          {property.city} • ₹{property.rentPerMonth.toLocaleString()}/month
                        </p>
                        <p className="text-xs text-nb-ink/50">
                          Token ID: {property.tokenId}
                        </p>
                        {property.error && (
                          <p className="text-xs text-nb-error">
                            Failed to load metadata
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded border border-nb-ink ${
                        property.isListed ? 'bg-nb-accent text-nb-ink' : 'bg-nb-bg text-nb-ink/70'
                      }`}>
                        {property.status}
                      </span>
                      {property.isRented && (
                        <span className="px-2 py-1 bg-nb-warn text-nb-ink text-xs rounded border border-nb-ink">
                          Rented
                        </span>
                      )}
                      {property.isDisputed && (
                        <span className="px-2 py-1 bg-nb-error text-nb-ink text-xs rounded border border-nb-ink">
                          Disputed
                        </span>
                      )}
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
                  Add New Property
                </NBButton>
              </Link>
              <NBButton 
                variant="ghost" 
                className="w-full justify-start"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Properties
              </NBButton>
              <NBButton variant="ghost" className="w-full justify-start" disabled>
                <DollarSign className="w-4 h-4 mr-2" />
                View Earnings
              </NBButton>
            </div>
          </NBCard>

          <NBCard>
            <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
              Blockchain Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-nb-ink/70">Connected Address</span>
                <span className="text-nb-ink/50 font-mono text-xs">
                  {web3Service.getAccount()?.slice(0, 6)}...{web3Service.getAccount()?.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-nb-ink/70">Network</span>
                <span className="text-nb-ink/50">BSC Testnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-nb-ink/70">Contract</span>
                <span className="text-nb-ink/50 font-mono text-xs">
                  0x2738...2696c
                </span>
              </div>
            </div>
          </NBCard>
        </div>
      </div>
    </div>
  );
}
