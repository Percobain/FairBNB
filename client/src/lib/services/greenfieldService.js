/**
 * @fileoverview BNB Greenfield service for storage operations using SDK
 */

import { Long, VisibilityType } from '@bnb-chain/greenfield-js-sdk';
import { client, selectSp, GREENFIELD_CONFIG } from './greenfieldClient';
import { getOffchainAuthKeys } from '../utils/offchainAuth';

class GreenfieldService {
  constructor() {
    this.bucketCreated = false;
    this.wallet = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the service with wallet connection
   */
  async initialize(walletAddress, walletProvider) {
    this.wallet = {
      address: walletAddress,
      provider: walletProvider
    };
    this.isInitialized = true;
    
    // Ensure bucket exists
    await this.ensureBucketExists();
  }

  /**
   * Create bucket if it doesn't exist using SDK
   */
  async ensureBucketExists() {
    try {
      if (this.bucketCreated) {
        return { success: true, bucketName: GREENFIELD_CONFIG.BUCKET_NAME };
      }

      if (!this.wallet?.address || !this.wallet?.provider) {
        throw new Error('Wallet not initialized');
      }

      // Check if bucket exists first
      try {
        const bucketInfo = await client.bucket.headBucket(GREENFIELD_CONFIG.BUCKET_NAME);
        if (bucketInfo) {
          this.bucketCreated = true;
          return { success: true, bucketName: GREENFIELD_CONFIG.BUCKET_NAME };
        }
      } catch (error) {
        // Bucket doesn't exist, proceed to create
        console.log('Bucket does not exist, creating...');
      }

      // Create bucket using SDK
      const spInfo = await selectSp();
      const createBucketTx = await client.bucket.createBucket({
        bucketName: GREENFIELD_CONFIG.BUCKET_NAME,
        creator: this.wallet.address,
        primarySpAddress: spInfo.primarySpAddress,
        visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
        chargedReadQuota: Long.fromString('0'),
        paymentAddress: this.wallet.address,
      });

      const simulateInfo = await createBucketTx.simulate({
        denom: 'BNB',
      });

      const res = await createBucketTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: this.wallet.address,
        granter: '',
      });

      if (res.code === 0) {
        this.bucketCreated = true;
        return { success: true, bucketName: GREENFIELD_CONFIG.BUCKET_NAME };
      } else {
        throw new Error(`Failed to create bucket: ${res.rawLog}`);
      }
    } catch (error) {
      console.error('Failed to ensure bucket exists:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload listing metadata to Greenfield as JSON
   */
  async uploadListingMetadata(listingData) {
    try {
      if (!this.wallet?.address || !this.wallet?.provider) {
        throw new Error('Wallet not initialized');
      }

      // Generate unique listing ID
      const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare metadata JSON
      const metadata = {
        id: listingId,
        timestamp: new Date().toISOString(),
        type: 'property_listing',
        version: '1.0.0',
        data: {
          // Basic info
          title: listingData.title,
          propertyType: listingData.propertyType,
          description: listingData.description,
          
          // Location
          location: {
            address: listingData.address,
            city: listingData.city,
            state: listingData.state,
            country: listingData.country,
            pincode: listingData.pincode
          },
          
          // Pricing
          pricing: {
            rentPerMonth: listingData.rentPerMonth,
            securityDeposit: listingData.securityDeposit,
            disputeFee: listingData.disputeFee,
            currency: 'BNB'
          },
          
          // Availability
          availability: {
            availableFrom: listingData.availableFrom,
            minDurationMonths: listingData.minDurationMonths,
            maxDurationMonths: listingData.maxDurationMonths
          },
          
          // Media
          photos: listingData.photos || [],
          coverImageIndex: listingData.coverImage || 0,
          
          // Additional
          amenities: listingData.amenities || [],
          
          // Blockchain data
          owner: this.wallet.address,
          blockchain: {
            network: 'bnb-greenfield',
            chainId: GREENFIELD_CONFIG.GREEN_CHAIN_ID
          }
        }
      };

      // Convert to file
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
      const objectName = `listings/${listingId}/metadata.json`;

      // Get off-chain auth keys
      const offChainData = await getOffchainAuthKeys(this.wallet.address, this.wallet.provider);
      if (!offChainData) {
        throw new Error('Failed to get off-chain authentication keys');
      }

      // Upload using delegated upload
      const uploadRes = await client.object.delegateUploadObject({
        bucketName: GREENFIELD_CONFIG.BUCKET_NAME,
        objectName: objectName,
        body: metadataBlob,
        delegatedOpts: {
          visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
        },
        onProgress: (e) => {
          console.log('Upload progress:', e.percent);
        },
      }, {
        type: 'EDDSA',
        address: this.wallet.address,
        domain: window.location.origin,
        seed: offChainData.seedString,
      });

      if (uploadRes.code === 0) {
        const greenfieldUrl = `gnfd://${GREENFIELD_CONFIG.BUCKET_NAME}/${objectName}`;
        return {
          success: true,
          listingId,
          metadataUrl: greenfieldUrl,
          objectName,
          metadata
        };
      } else {
        throw new Error(`Upload failed: ${uploadRes.message}`);
      }
    } catch (error) {
      console.error('Failed to upload listing metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download metadata from Greenfield
   */
  async getListingMetadata(objectName) {
    try {
      if (!this.wallet?.address || !this.wallet?.provider) {
        throw new Error('Wallet not initialized');
      }

      const offChainData = await getOffchainAuthKeys(this.wallet.address, this.wallet.provider);
      if (!offChainData) {
        throw new Error('Failed to get off-chain authentication keys');
      }

      const downloadRes = await client.object.downloadFile(
        {
          bucketName: GREENFIELD_CONFIG.BUCKET_NAME,
          objectName: objectName,
        },
        {
          type: 'EDDSA',
          address: this.wallet.address,
          domain: window.location.origin,
          seed: offChainData.seedString,
        },
      );

      return {
        success: true,
        data: downloadRes
      };
    } catch (error) {
      console.error('Failed to get listing metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get public URL for object
   */
  getPublicUrl(objectName) {
    const spInfo = selectSp();
    return `https://${GREENFIELD_CONFIG.BUCKET_NAME}.${spInfo.endpoint.replace('https://', '')}/${objectName}`;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized() {
    return this.isInitialized && this.wallet?.address && this.wallet?.provider;
  }
}

// Export singleton instance
export const greenfieldService = new GreenfieldService();
