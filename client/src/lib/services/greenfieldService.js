/**
 * @fileoverview BNB Greenfield service for storage operations
 */

import { ethers } from 'ethers';

// BNB Greenfield Configuration
const GREENFIELD_CONFIG = {
  rpcUrl: 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org',
  chainId: 'greenfield_5600-1',
  spEndpoints: [
    'https://gnfd-testnet-sp1.bnbchain.org',
    'https://gnfd-testnet-sp2.bnbchain.org',
    'https://gnfd-testnet-sp3.bnbchain.org',
    'https://gnfd-testnet-sp4.bnbchain.org'
  ],
  bucketName: 'test-fairbnb',
  primarySPAddress: '0x5ccF0F6b78a37Ef4e2CcBC10D155c28Fb8bE9BaF'
};

class GreenfieldService {
  constructor() {
    this.currentSPEndpoint = null;
    this.account = null;
    this.signer = null;
    this.bucketCreated = false;
  }

  /**
   * Initialize the service
   */
  initialize(account, signer) {
    this.account = account;
    this.signer = signer;
    this.currentSPEndpoint = GREENFIELD_CONFIG.spEndpoints[
      Math.floor(Math.random() * GREENFIELD_CONFIG.spEndpoints.length)
    ];
  }

  /**
   * Create bucket if it doesn't exist (restored method)
   */
  async ensureBucketExists() {
    try {
      if (this.bucketCreated) {
        return { success: true, bucketName: GREENFIELD_CONFIG.bucketName };
      }

      // Check if bucket exists
      const exists = await this.bucketExists(GREENFIELD_CONFIG.bucketName);
      if (exists.success && exists.exists) {
        this.bucketCreated = true;
        return { success: true, bucketName: GREENFIELD_CONFIG.bucketName };
      }

      // Create bucket
      const result = await this.createBucket(GREENFIELD_CONFIG.bucketName);
      if (result.success) {
        this.bucketCreated = true;
      }
      return result;
    } catch (error) {
      console.error('Failed to ensure bucket exists:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a bucket using REST API
   */
  async createBucket(bucketName) {
    try {
      const createBucketUrl = `${this.currentSPEndpoint}/greenfield/storage/create_bucket`;
      
      const bucketData = {
        bucket_name: bucketName,
        creator: this.account,
        visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
        payment_address: this.account,
        primary_sp_address: GREENFIELD_CONFIG.primarySPAddress,
        primary_sp_approval: {
          expired_height: '1000000',
          sig: '0x' // Will be signed
        },
        charged_read_quota: '0'
      };

      const response = await fetch(createBucketUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.account}`
        },
        body: JSON.stringify(bucketData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create bucket: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        bucketName,
        result
      };
    } catch (error) {
      console.error('Failed to create bucket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload object using REST API
   */
  async uploadObject(bucketName, objectName, file) {
    try {
      const uploadUrl = `${this.currentSPEndpoint}/greenfield/storage/put_object`;
      
      const formData = new FormData();
      formData.append('bucket_name', bucketName);
      formData.append('object_name', objectName);
      formData.append('file', file);
      formData.append('creator', this.account);
      formData.append('visibility', 'VISIBILITY_TYPE_PUBLIC_READ');
      formData.append('content_type', file.type);
      formData.append('redundancy_type', 'REDUNDANCY_EC_TYPE');

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.account}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        url: `greenfield://${bucketName}/${objectName}`,
        result
      };
    } catch (error) {
      console.error('Failed to upload object:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload metadata JSON to Greenfield (restored method)
   */
  async uploadMetadata(metadata, tokenId) {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      const blob = new Blob([metadataJson], { type: 'application/json' });
      const file = new File([blob], 'metadata.json');

      const objectName = `metadata/${tokenId}/metadata.json`;
      return await this.uploadObject(GREENFIELD_CONFIG.bucketName, objectName, file);
    } catch (error) {
      console.error('Failed to upload metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get object using REST API
   */
  async getObject(bucketName, objectName) {
    try {
      const getObjectUrl = `${this.currentSPEndpoint}/greenfield/storage/get_object`;
      
      const params = new URLSearchParams({
        bucket_name: bucketName,
        object_name: objectName
      });

      const response = await fetch(`${getObjectUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.account}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get object: ${response.statusText}`);
      }

      const data = await response.blob();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Failed to get object:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if bucket exists
   */
  async bucketExists(bucketName) {
    try {
      const headBucketUrl = `${this.currentSPEndpoint}/greenfield/storage/head_bucket`;
      
      const params = new URLSearchParams({
        bucket_name: bucketName
      });

      const response = await fetch(`${headBucketUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.account}`
        }
      });

      if (response.status === 404) {
        return {
          success: true,
          exists: false
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to check bucket: ${response.statusText}`);
      }

      return {
        success: true,
        exists: true
      };
    } catch (error) {
      console.error('Failed to check bucket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get public URL for object (restored method)
   */
  getPublicUrl(bucketName, objectName) {
    return `https://${bucketName}.${this.currentSPEndpoint.replace('https://', '')}/${objectName}`;
  }
}

// Export singleton instance
export const greenfieldService = new GreenfieldService();
