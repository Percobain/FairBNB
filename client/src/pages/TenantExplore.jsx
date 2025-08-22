/**
 * @fileoverview Tenant explore listings page with blockchain integration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar } from '@/components/FilterBar';
import { ListingCard } from '@/components/ListingCard';
import { NBCard } from '@/components/NBCard';
import { web3Service } from '@/lib/services/web3Service';
import { Search, RefreshCw } from 'lucide-react';
import { NBButton } from '@/components/NBButton';

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
              metadata: metadataResult.metadata
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
            error: true
          };
          processedProperties.push(placeholderProperty);
          citiesSet.add('Unknown');
          propertyTypesSet.add('Unknown');
        }
      }

      setProperties(processedProperties);
      setFilteredProperties(processedProperties);
      setCities(Array.from(citiesSet).sort());
      setPropertyTypes(Array.from(propertyTypesSet).sort());

    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
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

  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
    
    let filtered = properties;

    // Apply text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        (property.description && property.description.toLowerCase().includes(query))
      );
    }

    // Apply city filter
    if (filters.city && filters.city !== 'all') {
      filtered = filtered.filter(property => property.city === filters.city);
    }

    // Apply property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    // Apply price range filter
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.rentPerMonth >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.rentPerMonth <= parseInt(filters.maxPrice));
    }

    setFilteredProperties(filtered);
  };

  const handleViewListing = (id) => {
    navigate(`/tenant/listing/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading properties from blockchain...</div>
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
          <FilterBar
            query={currentFilters.query || ''}
            onChange={handleFilterChange}
            cities={cities}
            propertyTypes={propertyTypes}
          />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-xl text-nb-ink">
              {filteredProperties.length} Properties Found
            </h2>
            <select className="px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent">
              <option value="relevance">Sort by Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Property Grid */}
          {filteredProperties.length === 0 ? (
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
          </div>
        )}

        {/* Blockchain Info */}
        <div className="mt-16">
          <NBCard>
            <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
              Blockchain Information
            </h3>
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
          </NBCard>
        </div>
      </div>
    </div>
  );
}
