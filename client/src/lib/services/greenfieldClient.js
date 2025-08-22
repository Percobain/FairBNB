/**
 * @fileoverview BNB Greenfield client configuration and utilities with SES protection
 */

// Try to import SDK with SES error handling
let Client, VisibilityType, Long;

try {
  const sdk = require('@bnb-chain/greenfield-js-sdk');
  Client = sdk.Client;
  VisibilityType = sdk.VisibilityType;
  Long = sdk.Long;
} catch (requireError) {
  try {
    // Fallback to dynamic import
    import('@bnb-chain/greenfield-js-sdk').then(sdk => {
      Client = sdk.Client;
      VisibilityType = sdk.VisibilityType;
      Long = sdk.Long;
    }).catch(importError => {
      console.warn('Failed to import Greenfield SDK:', importError);
    });
  } catch (importError) {
    console.warn('Failed to import Greenfield SDK due to SES restrictions:', importError);
  }
}

// Fallback implementations if SDK fails to load
if (!Client) {
  Client = {
    create: () => {
      throw new Error('Greenfield SDK not available due to SES restrictions. Using fallback service.');
    }
  };
}

if (!VisibilityType) {
  VisibilityType = {
    VISIBILITY_TYPE_PUBLIC_READ: 'VISIBILITY_TYPE_PUBLIC_READ'
  };
}

if (!Long) {
  Long = {
    fromString: (str) => str
  };
}

// Greenfield configuration
export const GREENFIELD_CONFIG = {
  GRPC_URL: 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org',
  GREEN_CHAIN_ID: 5600,
  GREENFIELD_RPC_URL: 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org',
  BUCKET_NAME: 'fairbnb-listings'
};

// Create Greenfield client
export const client = Client.create(GREENFIELD_CONFIG.GRPC_URL, String(GREENFIELD_CONFIG.GREEN_CHAIN_ID));

/**
 * Get available storage providers
 */
export const getSps = async () => {
  const sps = await client.sp.getStorageProviders();
  const finalSps = (sps ?? []).filter((v) => v.endpoint.includes('nodereal'));
  return finalSps;
};

/**
 * Get all storage providers with metadata
 */
export const getAllSps = async () => {
  const sps = await getSps();
  return sps.map((sp) => ({
    address: sp.operatorAddress,
    endpoint: sp.endpoint,
    name: sp.description?.moniker,
  }));
};

/**
 * Select a random storage provider
 */
export const selectSp = async () => {
  const finalSps = await getSps();
  const selectIndex = Math.floor(Math.random() * finalSps.length);

  const secondarySpAddresses = [
    ...finalSps.slice(0, selectIndex),
    ...finalSps.slice(selectIndex + 1),
  ].map((item) => item.operatorAddress);

  return {
    id: finalSps[selectIndex].id,
    endpoint: finalSps[selectIndex].endpoint,
    primarySpAddress: finalSps[selectIndex]?.operatorAddress,
    sealAddress: finalSps[selectIndex].sealAddress,
    secondarySpAddresses,
  };
};
