/**
 * @fileoverview Disputes service for managing dispute resolution
 */

import { MOCK_DATA } from './mockData.js';

/**
 * @typedef {import('../types.js').Dispute} Dispute
 * @typedef {import('../types.js').CreateDisputeInput} CreateDisputeInput
 */

let disputes = [...MOCK_DATA.disputes];

/**
 * Create a new dispute
 * @param {CreateDisputeInput} input - Dispute creation data
 * @returns {Dispute} Created dispute
 */
export function create(input) {
  const newId = `disp_${String(disputes.length + 1).padStart(3, '0')}`;
  const newDispute = {
    id: newId,
    rentalId: input.rentalId,
    raisedBy: input.role,
    title: input.title,
    claimSummary: input.claimSummary,
    tenantStatement: input.role === 'tenant' ? input.detailedNarrative : '',
    landlordStatement: input.role === 'landlord' ? input.detailedNarrative : '',
    tenantEvidence: input.role === 'tenant' ? input.evidence : [],
    landlordEvidence: input.role === 'landlord' ? input.evidence : [],
    status: 'raised',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    result: null
  };
  
  disputes.push(newDispute);
  return newDispute;
}

/**
 * Get all active disputes for jury
 * @returns {Dispute[]} Active disputes
 */
export function listActive() {
  return disputes.filter(dispute => 
    dispute.status === 'under_review' || dispute.status === 'voting'
  );
}

/**
 * Get a dispute by ID
 * @param {string} id - Dispute ID
 * @returns {Dispute|null} Dispute details or null if not found
 */
export function getById(id) {
  return disputes.find(dispute => dispute.id === id) || null;
}

/**
 * Submit a statement and evidence for a dispute
 * @param {string} id - Dispute ID
 * @param {'tenant'|'landlord'} role - Role submitting the statement
 * @param {string} text - Statement text
 * @param {string[]} evidence - Evidence file URLs
 * @returns {Dispute|null} Updated dispute or null if not found
 */
export function submitStatement(id, role, text, evidence = []) {
  const dispute = disputes.find(d => d.id === id);
  if (!dispute) return null;
  
  if (role === 'tenant') {
    dispute.tenantStatement = text;
    dispute.tenantEvidence = evidence;
  } else if (role === 'landlord') {
    dispute.landlordStatement = text;
    dispute.landlordEvidence = evidence;
  }
  
  // If both statements are submitted, move to voting
  if (dispute.tenantStatement && dispute.landlordStatement) {
    dispute.status = 'voting';
  }
  
  return dispute;
}

/**
 * Open a dispute for voting
 * @param {string} id - Dispute ID
 * @returns {Dispute|null} Updated dispute or null if not found
 */
export function openForVoting(id) {
  const dispute = disputes.find(d => d.id === id);
  if (!dispute) return null;
  
  dispute.status = 'voting';
  return dispute;
}

/**
 * Cast a vote on a dispute
 * @param {string} id - Dispute ID
 * @param {'tenant'|'landlord'|'abstain'} choice - Vote choice
 * @returns {Dispute|null} Updated dispute or null if not found
 */
export function castVote(id, choice) {
  const dispute = disputes.find(d => d.id === id);
  if (!dispute) return null;
  
  // Mock voting logic - in real app would track multiple votes
  dispute.status = 'resolved';
  
  if (choice === 'abstain') {
    dispute.result = {
      winner: 'none',
      distributedFees: 0
    };
  } else {
    dispute.result = {
      winner: choice,
      distributedFees: Math.floor(Math.random() * 1000) + 500 // Mock fee distribution
    };
  }
  
  return dispute;
}

/**
 * Get disputes for a specific rental
 * @param {string} rentalId - Rental ID
 * @returns {Dispute[]} Disputes for the rental
 */
export function forRental(rentalId) {
  return disputes.filter(dispute => dispute.rentalId === rentalId);
}

/**
 * Get disputes where a user is involved (as tenant or landlord)
 * @param {string} userId - User ID
 * @param {'tenant'|'landlord'} role - User role
 * @returns {Dispute[]} User's disputes
 */
export function forUser(userId, role) {
  // This would require cross-referencing with rentals service in a real app
  // For now, return mock disputes
  return disputes.filter(dispute => dispute.raisedBy === role);
}

/**
 * Update dispute status
 * @param {string} id - Dispute ID
 * @param {'raised'|'under_review'|'voting'|'resolved'} status - New status
 * @returns {Dispute|null} Updated dispute or null if not found
 */
export function updateStatus(id, status) {
  const dispute = disputes.find(d => d.id === id);
  if (!dispute) return null;
  
  dispute.status = status;
  return dispute;
}

/**
 * Get dispute statistics
 * @returns {Object} Dispute statistics
 */
export function getStats() {
  return {
    total: disputes.length,
    raised: disputes.filter(d => d.status === 'raised').length,
    underReview: disputes.filter(d => d.status === 'under_review').length,
    voting: disputes.filter(d => d.status === 'voting').length,
    resolved: disputes.filter(d => d.status === 'resolved').length
  };
}
