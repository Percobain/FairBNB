/**
 * @fileoverview Type definitions for FairBNB application
 * Using JSDoc for type checking in JavaScript
 */

/**
 * @typedef {Object} Property
 * @property {string} id - Unique property identifier
 * @property {string} ownerId - Owner's user ID
 * @property {string} title - Property title
 * @property {'Apartment'|'Studio'|'PG'|'CoLiving'|'House'} propertyType - Type of property
 * @property {string} address - Street address
 * @property {string} city - City name
 * @property {string} state - State/province
 * @property {string} country - Country
 * @property {string} pincode - Postal code
 * @property {string} description - Property description
 * @property {string[]} amenities - List of amenities
 * @property {number} rentPerMonth - Monthly rent amount
 * @property {number} securityDeposit - Security deposit amount
 * @property {number} disputeFee - Dispute resolution fee
 * @property {string[]} acceptedTokens - Accepted payment tokens (display 'BNB' only)
 * @property {string} availableFrom - Available from date (ISO string)
 * @property {number} minDurationMonths - Minimum rental duration
 * @property {number} maxDurationMonths - Maximum rental duration
 * @property {string[]} photos - Array of photo URLs
 * @property {number} coverImage - Index of cover image in photos array
 */

/**
 * @typedef {Object} ListingSummary
 * @property {string} id - Property ID
 * @property {string} title - Property title
 * @property {string} city - City name
 * @property {number} rentPerMonth - Monthly rent amount
 * @property {number} securityDeposit - Security deposit amount
 * @property {string} coverImage - Cover image URL
 * @property {'available'|'rented'|'maintenance'} status - Property status
 */

/**
 * @typedef {Object} Rental
 * @property {string} id - Rental ID
 * @property {string} propertyId - Associated property ID
 * @property {string} landlordId - Landlord user ID
 * @property {string} tenantId - Tenant user ID
 * @property {string} startDate - Rental start date (ISO string)
 * @property {number} durationMonths - Rental duration in months
 * @property {'initiated'|'active'|'completed'|'disputed'|'resolved'} status - Rental status
 */

/**
 * @typedef {Object} Dispute
 * @property {string} id - Dispute ID
 * @property {string} rentalId - Associated rental ID
 * @property {'tenant'|'landlord'} raisedBy - Who raised the dispute
 * @property {string} title - Dispute title
 * @property {string} claimSummary - Brief summary of the claim
 * @property {string} tenantStatement - Tenant's detailed statement
 * @property {string} landlordStatement - Landlord's detailed statement
 * @property {string[]} tenantEvidence - Tenant's evidence files
 * @property {string[]} landlordEvidence - Landlord's evidence files
 * @property {'raised'|'under_review'|'voting'|'resolved'} status - Dispute status
 * @property {string} deadline - Voting deadline (ISO string)
 * @property {DisputeResult|null} result - Dispute resolution result
 */

/**
 * @typedef {Object} DisputeResult
 * @property {'tenant'|'landlord'|'none'} winner - Dispute winner
 * @property {number} distributedFees - Fees distributed amount
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {'landlord'|'tenant'|'jury'} role - User role
 * @property {string} name - User's display name
 * @property {string} avatarUrl - Avatar image URL
 */

/**
 * @typedef {Object} CreatePropertyInput
 * @property {string} title
 * @property {'Apartment'|'Studio'|'PG'|'CoLiving'|'House'} propertyType
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} country
 * @property {string} pincode
 * @property {string} description
 * @property {string[]} amenities
 * @property {number} rentPerMonth
 * @property {number} securityDeposit
 * @property {number} disputeFee
 * @property {string} availableFrom
 * @property {number} minDurationMonths
 * @property {number} maxDurationMonths
 * @property {string[]} photos
 * @property {number} coverImage
 */

/**
 * @typedef {Object} CreateDisputeInput
 * @property {string} rentalId
 * @property {'tenant'|'landlord'} role
 * @property {string} title
 * @property {string} claimSummary
 * @property {string} detailedNarrative
 * @property {string[]} evidence
 * @property {'refund'|'partial'|'landlordWins'|'other'} desiredOutcome
 */

/**
 * @typedef {Object} FilterParams
 * @property {string} query - Search query
 * @property {string} city - Filter by city
 * @property {number} minPrice - Minimum price filter
 * @property {number} maxPrice - Maximum price filter
 * @property {'Apartment'|'Studio'|'PG'|'CoLiving'|'House'} propertyType - Property type filter
 * @property {number} minDuration - Minimum duration filter
 * @property {string} availableFrom - Available from date filter
 */

export {};
