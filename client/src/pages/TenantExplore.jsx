/**
 * @fileoverview Tenant explore listings page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar } from '@/components/FilterBar';
import { ListingCard } from '@/components/ListingCard';
import { NBCard } from '@/components/NBCard';
import { listAll, getCities, getPropertyTypes } from '@/lib/services/propertiesService';
import { Search } from 'lucide-react';

/**
 * Tenant property exploration page with filters
 */
export function TenantExplore() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all properties
        const allProperties = listAll();
        setProperties(allProperties);
        setFilteredProperties(allProperties);

        // Load filter options
        setCities(getCities());
        setPropertyTypes(getPropertyTypes());

        // Apply initial filters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const initialFilters = {};
        for (const [key, value] of urlParams.entries()) {
          if (value && value !== 'all') {
            initialFilters[key] = value;
          }
        }
        
        if (Object.keys(initialFilters).length > 0) {
          handleFilterChange(initialFilters);
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
    const filtered = listAll(filters);
    setFilteredProperties(filtered);
  };

  const handleViewListing = (id) => {
    navigate(`/tenant/listing/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Explore Properties
          </h1>
          <p className="font-body text-nb-ink/70">
            Find your perfect rental with transparent terms and escrow protection
          </p>
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
                  badges={['Available']}
                  onView={handleViewListing}
                />
              ))}
            </div>
          )}

          {/* Load More (Mock) */}
          {filteredProperties.length > 0 && filteredProperties.length >= 9 && (
            <div className="text-center pt-8">
              <button 
                className="font-body text-nb-ink/70 hover:text-nb-ink underline"
                disabled
              >
                Load more properties (demo)
              </button>
            </div>
          )}
        </div>

        {/* Popular Locations */}
        <div className="mt-16">
          <h3 className="font-display font-bold text-xl text-nb-ink mb-6">
            Popular Locations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map((city) => {
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
      </div>
    </div>
  );
}
