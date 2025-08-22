/**
 * @fileoverview Off-chain authentication utilities for Greenfield
 */

import { client, getAllSps, GREENFIELD_CONFIG } from '../services/greenfieldClient';

/**
 * Generate off-chain auth key pair and upload public key to storage providers
 * @param {string} address - User wallet address
 * @param {any} provider - Wallet provider
 * @returns {Promise<Object>} Off-chain authentication data
 */
export const getOffchainAuthKeys = async (address, provider) => {
  const storageKey = `gf_auth_${address}`;
  const storageResStr = localStorage.getItem(storageKey);

  // Check if we have valid cached auth keys
  if (storageResStr) {
    try {
      const storageRes = JSON.parse(storageResStr);
      if (storageRes.expirationTime && storageRes.expirationTime > Date.now()) {
        return storageRes;
      }
      // Remove expired keys
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error parsing stored auth data:', error);
      localStorage.removeItem(storageKey);
    }
  }

  try {
    const allSps = await getAllSps();
    const offchainAuthRes = await client.offchainauth.genOffChainAuthKeyPairAndUpload(
      {
        sps: allSps,
        chainId: GREENFIELD_CONFIG.GREEN_CHAIN_ID,
        expirationMs: 5 * 24 * 60 * 60 * 1000, // 5 days
        domain: window.location.origin,
        address,
      },
      provider,
    );

    const { code, body: offChainData } = offchainAuthRes;
    if (code !== 0 || !offChainData) {
      throw new Error('Failed to generate off-chain auth keys');
    }

    // Store in localStorage for future use
    localStorage.setItem(storageKey, JSON.stringify(offChainData));
    return offChainData;
  } catch (error) {
    console.error('Error generating off-chain auth keys:', error);
    throw error;
  }
};

