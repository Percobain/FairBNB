/**
 * @fileoverview Properties service for managing property listings
 */

import { MOCK_DATA } from './mockData.js';

/**
 * @typedef {import('../types.js').Property} Property
 * @typedef {import('../types.js').ListingSummary} ListingSummary
 * @typedef {import('../types.js').CreatePropertyInput} CreatePropertyInput
 * @typedef {import('../types.js').FilterParams} FilterParams
 */

let properties = [...MOCK_DATA.properties];

/**
 * Get all properties with optional filtering
 * @param {Partial<FilterParams>} filters - Filter parameters
 * @returns {ListingSummary[]} Filtered property listings
 */
export function listAll(filters = {}) {
  let filtered = [...properties];
  
  // Apply filters
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(prop => 
      prop.title.toLowerCase().includes(query) ||
      prop.city.toLowerCase().includes(query) ||
      prop.description.toLowerCase().includes(query)
    );
  }
  
  if (filters.city && filters.city !== 'all') {
    filtered = filtered.filter(prop => prop.city === filters.city);
  }
  
  if (filters.propertyType && filters.propertyType !== 'all') {
    filtered = filtered.filter(prop => prop.propertyType === filters.propertyType);
  }
  
  if (filters.minPrice) {
    filtered = filtered.filter(prop => prop.rentPerMonth >= filters.minPrice);
  }
  
  if (filters.maxPrice) {
    filtered = filtered.filter(prop => prop.rentPerMonth <= filters.maxPrice);
  }
  
  if (filters.minDuration) {
    filtered = filtered.filter(prop => prop.maxDurationMonths >= filters.minDuration);
  }
  
  if (filters.availableFrom) {
    filtered = filtered.filter(prop => 
      new Date(prop.availableFrom) <= new Date(filters.availableFrom)
    );
  }
  
  // Convert to ListingSummary format
  return filtered.map(prop => ({
    id: prop.id,
    title: prop.title,
    city: prop.city,
    rentPerMonth: prop.rentPerMonth,
    securityDeposit: prop.securityDeposit,
    coverImage: prop.photos[prop.coverImage],
    status: 'available' // Mock status
  }));
}

/**
 * Get a property by ID
 * @param {string} id - Property ID
 * @returns {Property|null} Property details or null if not found
 */
export function getById(id) {
  return properties.find(prop => prop.id === id) || null;
}

/**
 * Create a new property listing
 * @param {CreatePropertyInput} input - Property creation data
 * @returns {Property} Created property
 */
export function create(input) {
  const newId = `prop_${String(properties.length + 1).padStart(3, '0')}`;
  const newProperty = {
    id: newId,
    ownerId: 'user_001', // Mock current user as landlord
    ...input,
    acceptedTokens: ['BNB'] // Always BNB for demo
  };
  
  properties.push(newProperty);
  return newProperty;
}

/**
 * Get properties owned by a specific owner
 * @param {string} ownerId - Owner's user ID
 * @returns {ListingSummary[]} Owner's properties
 */
export function forOwner(ownerId) {
  return properties
    .filter(prop => prop.ownerId === ownerId)
    .map(prop => ({
      id: prop.id,
      title: prop.title,
      city: prop.city,
      rentPerMonth: prop.rentPerMonth,
      securityDeposit: prop.securityDeposit,
      coverImage: prop.photos[prop.coverImage],
      status: 'available' // Mock status
    }));
}

/**
 * Update a property
 * @param {string} id - Property ID
 * @param {Partial<CreatePropertyInput>} updates - Property updates
 * @returns {Property|null} Updated property or null if not found
 */
export function update(id, updates) {
  const index = properties.findIndex(prop => prop.id === id);
  if (index === -1) return null;
  
  properties[index] = { ...properties[index], ...updates };
  return properties[index];
}

/**
 * Delete a property (archive)
 * @param {string} id - Property ID
 * @returns {boolean} Success status
 */
export function archive(id) {
  const index = properties.findIndex(prop => prop.id === id);
  if (index === -1) return false;
  
  properties.splice(index, 1);
  return true;
}

/**
 * Get unique cities for filter options
 * @returns {string[]} List of cities
 */
export function getCities() {
  const cities = [...new Set(properties.map(prop => prop.city))];
  return cities.sort();
}

/**
 * Get property types for filter options
 * @returns {string[]} List of property types
 */
export function getPropertyTypes() {
  return ['Apartment', 'Studio', 'PG', 'CoLiving', 'House'];
}
