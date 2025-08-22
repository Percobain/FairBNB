/**
 * @fileoverview Rentals service for managing rental bookings and escrow
 */

import { MOCK_DATA } from './mockData.js';

/**
 * @typedef {import('../types.js').Rental} Rental
 */

let rentals = [...MOCK_DATA.rentals];

/**
 * Create a new rental booking
 * @param {Object} bookingData - Booking information
 * @param {string} bookingData.propertyId - Property ID
 * @param {string} bookingData.tenantId - Tenant user ID
 * @param {number} bookingData.durationMonths - Rental duration in months
 * @param {string} bookingData.startDate - Rental start date (ISO string)
 * @returns {Rental} Created rental
 */
export function createBooking({ propertyId, tenantId, durationMonths, startDate }) {
  const newId = `rent_${String(rentals.length + 1).padStart(3, '0')}`;
  const newRental = {
    id: newId,
    propertyId,
    landlordId: 'user_001', // Mock - should get from property owner
    tenantId,
    startDate,
    durationMonths,
    status: 'initiated'
  };
  
  rentals.push(newRental);
  return newRental;
}

/**
 * Get a rental by ID
 * @param {string} id - Rental ID
 * @returns {Rental|null} Rental details or null if not found
 */
export function getById(id) {
  return rentals.find(rental => rental.id === id) || null;
}

/**
 * Mark a rental as completed (happy path)
 * @param {string} id - Rental ID
 * @returns {Rental|null} Updated rental or null if not found
 */
export function markCompleted(id) {
  const rental = rentals.find(r => r.id === id);
  if (!rental) return null;
  
  rental.status = 'completed';
  return rental;
}

/**
 * Flag a rental for dispute
 * @param {string} id - Rental ID
 * @returns {Rental|null} Updated rental or null if not found
 */
export function flagDispute(id) {
  const rental = rentals.find(r => r.id === id);
  if (!rental) return null;
  
  rental.status = 'disputed';
  return rental;
}

/**
 * Get rentals for a specific user (landlord or tenant)
 * @param {string} userId - User ID
 * @param {'landlord'|'tenant'} role - User role
 * @returns {Rental[]} User's rentals
 */
export function forUser(userId, role) {
  if (role === 'landlord') {
    return rentals.filter(rental => rental.landlordId === userId);
  } else if (role === 'tenant') {
    return rentals.filter(rental => rental.tenantId === userId);
  }
  return [];
}

/**
 * Update rental status
 * @param {string} id - Rental ID
 * @param {'initiated'|'active'|'completed'|'disputed'|'resolved'} status - New status
 * @returns {Rental|null} Updated rental or null if not found
 */
export function updateStatus(id, status) {
  const rental = rentals.find(r => r.id === id);
  if (!rental) return null;
  
  rental.status = status;
  return rental;
}

/**
 * Get all active rentals
 * @returns {Rental[]} Active rentals
 */
export function getActive() {
  return rentals.filter(rental => rental.status === 'active');
}

/**
 * Get rental statistics for a landlord
 * @param {string} landlordId - Landlord user ID
 * @returns {Object} Rental statistics
 */
export function getStatsForLandlord(landlordId) {
  const landlordRentals = rentals.filter(rental => rental.landlordId === landlordId);
  
  return {
    total: landlordRentals.length,
    active: landlordRentals.filter(r => r.status === 'active').length,
    completed: landlordRentals.filter(r => r.status === 'completed').length,
    disputed: landlordRentals.filter(r => r.status === 'disputed').length
  };
}
