/**
 * @fileoverview Tenant explore listings page with blockchain integration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar } from '@/components/FilterBar';
import { ListingCard } from '@/components/ListingCard';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { SearchFilterSkeleton, TenantListingsGridSkeleton, Skeleton } from '@/components/SkeletonLoader';
import { web3Service } from '@/lib/services/web3Service';
import { Search, RefreshCw } from 'lucide-react';

/**
 * Tenant property exploration page with blockchain data
 */
export function TenantExplore() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');

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

  const loadAllListings = async () => {
    try {
      setLoading(true);
      
      // Check if Web3 is connected
      if (!web3Service.isWeb3Connected()) {
        const initResult = await web3Service.initialize();
        if (!initResult.success) {
          throw new Error(initResult.error);
        }
      }

      // Get all available listings from blockchain
      const result = await web3Service.getAvailableListings();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Process listings and fetch metadata
      const processedProperties = [];
      const citiesSet = new Set();
      const propertyTypesSet = new Set();

      for (const listing of result.listings) {
        try {
          const metadataResult = await web3Service.getMetadataFromURI(listing.tokenURI);
          if (metadataResult.success) {
            const imageUrl = getImageUrl(metadataResult.metadata.image);
            
            const property = {
              id: listing.tokenId,
              tokenId: listing.tokenId,
              title: metadataResult.metadata.name,
              city: metadataResult.metadata.city,
              state: metadataResult.metadata.state,
              propertyType: metadataResult.metadata.propertyType,
              rentPerMonth: parseInt(listing.rent),
              securityDeposit: parseInt(listing.deposit),
              disputeFee: parseInt(listing.disputeFee),
              coverImage: imageUrl,
              description: metadataResult.metadata.description,
              landlord: listing.landlord,
              metadata: metadataResult.metadata,
              createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Mock creation date for sorting
            };

            processedProperties.push(property);
            citiesSet.add(property.city);
            propertyTypesSet.add(property.propertyType);
          }
        } catch (error) {
          console.error(`Failed to process listing ${listing.tokenId}:`, error);
          // Add a placeholder property for failed listings
          const placeholderProperty = {
            id: listing.tokenId,
            tokenId: listing.tokenId,
            title: `Property #${listing.tokenId}`,
            city: 'Unknown',
            state: 'Unknown',
            propertyType: 'Unknown',
            rentPerMonth: parseInt(listing.rent) || 0,
            securityDeposit: parseInt(listing.deposit) || 0,
            disputeFee: parseInt(listing.disputeFee) || 0,
            coverImage: '/mock-images/placeholder-property.jpg',
            description: 'Property details unavailable',
            landlord: listing.landlord,
            metadata: null,
            error: true,
            createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          };
          processedProperties.push(placeholderProperty);
          citiesSet.add('Unknown');
          propertyTypesSet.add('Unknown');
        }
      }

      setProperties(processedProperties);
      setCities(Array.from(citiesSet).sort());
      setPropertyTypes(Array.from(propertyTypesSet).sort());

    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting function
  const sortProperties = (properties, sortType) => {
    const sorted = [...properties];
    
    switch (sortType) {
      case 'price-low':
        return sorted.sort((a, b) => a.rentPerMonth - b.rentPerMonth);
      
      case 'price-high':
        return sorted.sort((a, b) => b.rentPerMonth - a.rentPerMonth);
      
      case 'newest':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      
      case 'relevance':
      default:
        // Sort by a combination of factors for relevance
        return sorted.sort((a, b) => {
          // Prioritize non-error properties
          if (a.error && !b.error) return 1;
          if (!a.error && b.error) return -1;
          
          // Then sort by a relevance score (example: based on completeness of data)
          const getRelevanceScore = (property) => {
            let score = 0;
            if (property.description && property.description !== 'Property details unavailable') score += 3;
            if (property.city !== 'Unknown') score += 2;
            if (property.propertyType !== 'Unknown') score += 2;
            if (property.coverImage !== '/mock-images/placeholder-property.jpg') score += 1;
            return score;
          };
          
          const scoreA = getRelevanceScore(a);
          const scoreB = getRelevanceScore(b);
          
          if (scoreA !== scoreB) return scoreB - scoreA;
          
          // If relevance scores are equal, sort by newest
          return b.createdAt - a.createdAt;
        });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllListings();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllListings();
  }, []);

  // Update filtered properties when filters or properties change
  useEffect(() => {
    let filtered = properties;

    // Apply text search
    if (currentFilters.query) {
      const query = currentFilters.query.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        (property.description && property.description.toLowerCase().includes(query))
      );
    }

    // Apply city filter
    if (currentFilters.city && currentFilters.city !== 'all') {
      filtered = filtered.filter(property => property.city === currentFilters.city);
    }

    // Apply property type filter
    if (currentFilters.propertyType && currentFilters.propertyType !== 'all') {
      filtered = filtered.filter(property => property.propertyType === currentFilters.propertyType);
    }

    // Apply price range filter
    if (currentFilters.minPrice) {
      filtered = filtered.filter(property => property.rentPerMonth >= parseInt(currentFilters.minPrice));
    }
    if (currentFilters.maxPrice) {
      filtered = filtered.filter(property => property.rentPerMonth <= parseInt(currentFilters.maxPrice));
    }

    // Apply sorting
    const sorted = sortProperties(filtered, sortBy);
    setFilteredProperties(sorted);
  }, [properties, currentFilters, sortBy]);

  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleViewListing = (id) => {
    navigate(`/tenant/listing/${id}`);
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
            <Skeleton className="h-10 w-24 mt-4 sm:mt-0" />
          </div>

          {/* Search/Filter Skeleton */}
          <SearchFilterSkeleton />

          {/* Results Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Properties Grid Skeleton */}
          <TenantListingsGridSkeleton count={9} />

          {/* Popular Locations Skeleton */}
          <div className="mt-16">
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 bg-nb-card border-2 border-nb-ink rounded-nb">
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Info Skeleton */}
          <div className="mt-16">
            <NBCard>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-24 mr-2" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-16 mr-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-16 mr-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
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
              Explore Properties
            </h1>
            <p className="font-body text-nb-ink/70">
              Find your perfect rental with transparent terms and blockchain escrow protection
            </p>
          </div>
          <NBButton
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </NBButton>
        </div>

        {/* Filters */}
        <div className="mb-8">
          {refreshing ? (
            <SearchFilterSkeleton />
          ) : (
            <FilterBar
              query={currentFilters.query || ''}
              onChange={handleFilterChange}
              cities={cities}
              propertyTypes={propertyTypes}
            />
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex justify-between items-center">
            {refreshing ? (
              <>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-10 w-40" />
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-xl text-nb-ink">
                  {filteredProperties.length} Properties Found
                </h2>
                <select 
                  className="px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </>
            )}
          </div>

          {/* Property Grid */}
          {refreshing ? (
            <TenantListingsGridSkeleton count={9} />
          ) : filteredProperties.length === 0 ? (
            <NBCard className="text-center py-16">
              <Search className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
                No properties found
              </h3>
              <p className="font-body text-nb-ink/70 mb-6">
                Try adjusting your filters or search terms
              </p>
            </NBCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <ListingCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  city={property.city}
                  rentPerMonth={property.rentPerMonth}
                  deposit={property.securityDeposit}
                  coverImage={property.coverImage}
                  badges={['Available', property.propertyType]}
                  onView={handleViewListing}
                />
              ))}
            </div>
          )}
        </div>

        {/* Popular Locations */}
        {cities.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display font-bold text-xl text-nb-ink mb-6">
              Popular Locations
            </h3>
            {refreshing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 bg-nb-card border-2 border-nb-ink rounded-nb">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cities.slice(0, 6).map((city) => {
                  const cityCount = properties.filter(p => p.city === city).length;
                  return (
                    <button
                      key={city}
                      onClick={() => handleFilterChange({ ...currentFilters, city })}
                      className="p-4 bg-nb-card border-2 border-nb-ink rounded-nb shadow-nb-sm hover:-translate-y-1 transition-transform duration-200 text-center"
                    >
                      <div className="font-display font-bold text-nb-ink">{city}</div>
                      <div className="text-sm text-nb-ink/70">{cityCount} properties</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Blockchain Info */}
        <div className="mt-16">
          <NBCard>
            <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
              Blockchain Information
            </h3>
            {refreshing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-24 mr-2" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-16 mr-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-16 mr-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-nb-ink/70">Total Properties:</span>
                  <span className="text-nb-ink ml-2 font-bold">{properties.length}</span>
                </div>
                <div>
                  <span className="text-nb-ink/70">Network:</span>
                  <span className="text-nb-ink ml-2">BSC Testnet</span>
                </div>
                <div>
                  <span className="text-nb-ink/70">Contract:</span>
                  <span className="text-nb-ink ml-2 font-mono text-xs">
                    0x2738...2696c
                  </span>
                </div>
              </div>
            )}
          </NBCard>
        </div>
      </div>
    </div>
  );
}
