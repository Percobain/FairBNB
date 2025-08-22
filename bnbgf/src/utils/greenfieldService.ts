import { client, selectSp, getAllSps } from '@/client';
import { GREEN_CHAIN_ID } from '@/config/env';
import { 
  Long, 
  OnProgressEvent, 
  VisibilityType,
  IReturnOffChainAuthKeyPairAndUpload 
} from '@bnb-chain/greenfield-js-sdk';

export interface BucketInfo {
  bucketName: string;
  creator: string;
  visibility: VisibilityType;
}

export interface ObjectInfo {
  bucketName: string;
  objectName: string;
  file: File;
  visibility?: VisibilityType;
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

// Hardcoded bucket information from testnet.dcellar.io
const HARDCODED_BUCKET = {
  BucketInfo: {
    BucketName: 'hellotoys',
    Owner: '0x9f4e0E3B9F1d6d1dbA403128B8ECFc25794a6e14',
    Id: '0x00000000000000000000000000000000000000000000000000000000000056c0',
    CreateAt: '1724346900', // Aug 22, 2025 22:15 PM (UTC+05:30) converted to timestamp
    Visibility: 2, // Public read
    PrimarySpAddress: '0x2a15da875b1bA0F82eb3A67ae027f5844915bA5a',
    PaymentAddress: '0x9f4e0E3B9F1d6d1dbA403128B8ECFc25794a6e14'
  }
};

export class GreenfieldService {
  private static instance: GreenfieldService;
  
  public static getInstance(): GreenfieldService {
    if (!GreenfieldService.instance) {
      GreenfieldService.instance = new GreenfieldService();
    }
    return GreenfieldService.instance;
  }

  /**
   * Get off-chain authentication keys
   */
  async getOffchainAuthKeys(address: string, provider: any): Promise<IReturnOffChainAuthKeyPairAndUpload> {
    const storageResStr = localStorage.getItem(address);

    if (storageResStr) {
      const storageRes = JSON.parse(storageResStr) as IReturnOffChainAuthKeyPairAndUpload;
      if (storageRes.expirationTime < Date.now()) {
        localStorage.removeItem(address);
        throw new Error('Auth key expired, please generate a new one');
      }
      return storageRes;
    }

    const allSps = await getAllSps();
    const offchainAuthRes = await client.offchainauth.genOffChainAuthKeyPairAndUpload(
      {
        sps: allSps,
        chainId: GREEN_CHAIN_ID,
        expirationMs: 5 * 24 * 60 * 60 * 1000, // 5 days
        domain: window.location.origin,
        address,
      },
      provider,
    );

    const { code, body: offChainData } = offchainAuthRes;
    if (code !== 0 || !offChainData) {
      throw offchainAuthRes;
    }

    localStorage.setItem(address, JSON.stringify(offChainData));
    return offChainData;
  }

  /**
   * Create a new bucket (disabled since we're using hardcoded bucket)
   */
  async createBucket(
    bucketInfo: BucketInfo, 
    address: string, 
    provider: any,
    onProgress?: (progress: string) => void
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    return { 
      success: false, 
      error: 'Bucket creation disabled - using hardcoded bucket "hellotoys"' 
    };
  }

  /**
   * Upload a file to the hardcoded Greenfield bucket
   */
  async uploadFile(
    objectInfo: ObjectInfo,
    address: string,
    provider: any,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; objectId?: string; error?: string }> {
    try {
      const offChainData = await this.getOffchainAuthKeys(address, provider);

      // Use the hardcoded bucket
      const res = await client.object.delegateUploadObject({
        bucketName: HARDCODED_BUCKET.BucketInfo.BucketName,
        objectName: objectInfo.objectName,
        body: objectInfo.file,
        delegatedOpts: {
          visibility: objectInfo.visibility || VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
        },
        onProgress: (e: OnProgressEvent) => {
          onProgress?.({
            percent: e.percent,
            loaded: e.loaded,
            total: e.total
          });
        },
      }, {
        type: 'EDDSA',
        address: address,
        domain: window.location.origin,
        seed: offChainData.seedString,
      });

      if (res.code === 0) {
        return { success: true, objectId: res.body || 'uploaded' };
      } else {
        return { success: false, error: `Upload failed: ${res.message}` };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Download a file from the hardcoded Greenfield bucket
   */
  async downloadFile(
    bucketName: string,
    objectName: string,
    address: string,
    provider: any
  ): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const offChainData = await this.getOffchainAuthKeys(address, provider);

      const res = await client.object.downloadFile(
        {
          bucketName: HARDCODED_BUCKET.BucketInfo.BucketName, // Use hardcoded bucket
          objectName,
        },
        {
          type: 'EDDSA',
          address,
          domain: window.location.origin,
          seed: offChainData.seedString,
        },
      );

      // downloadFile returns a Blob directly, not a response object
      return { success: true, data: res };
    } catch (error) {
      console.error('Download error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * List buckets - returns the hardcoded bucket
   */
  async listBuckets(address: string): Promise<{ success: boolean; buckets?: any[]; error?: string }> {
    try {
      // Return the hardcoded bucket
      return { 
        success: true, 
        buckets: [HARDCODED_BUCKET] 
      };
    } catch (error) {
      console.error('List buckets error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * List objects in the hardcoded bucket
   */
  async listObjects(
    bucketName: string,
    address: string
  ): Promise<{ success: boolean; objects?: any[]; error?: string }> {
    try {
      // Use the correct API method for listing objects
      const res = await client.object.listObjects({
        bucketName: HARDCODED_BUCKET.BucketInfo.BucketName, // Use hardcoded bucket
      });

      // Handle the response structure correctly
      if (res && res.body) {
        return { success: true, objects: res.body };
      } else if (Array.isArray(res)) {
        return { success: true, objects: res };
      } else {
        return { success: true, objects: [] };
      }
    } catch (error) {
      console.error('List objects error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete an object from the hardcoded bucket
   */
  async deleteObject(
    bucketName: string,
    objectName: string,
    address: string,
    provider: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const offChainData = await this.getOffchainAuthKeys(address, provider);

      // Create delete transaction
      const deleteObjectTx = await client.object.deleteObject({
        bucketName: HARDCODED_BUCKET.BucketInfo.BucketName, // Use hardcoded bucket
        objectName,
        operator: address,
      });

      // Simulate the transaction
      const simulateInfo = await deleteObjectTx.simulate({
        denom: 'BNB',
      });

      // Broadcast the transaction
      const res = await deleteObjectTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: address,
        granter: '',
      });

      if (res.code === 0) {
        return { success: true };
      } else {
        return { success: false, error: `Delete failed: ${res.rawLog}` };
      }
    } catch (error) {
      console.error('Delete object error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get the hardcoded bucket information
   */
  getHardcodedBucket() {
    return HARDCODED_BUCKET;
  }
}

export const greenfieldService = GreenfieldService.getInstance();
