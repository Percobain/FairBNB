/**
 * @fileoverview Pinata IPFS service for storage operations
 */

// Pinata Configuration
const PINATA_CONFIG = {
  gateway: 'https://yellow-acceptable-ant-242.mypinata.cloud',
  apiUrl: 'https://api.pinata.cloud',
  // You'll need to add these to your environment variables
  jwt: import.meta.env.VITE_PINATA_JWT || '', // Add your JWT here
};

class PinataService {
  constructor() {
    this.gateway = PINATA_CONFIG.gateway;
    this.apiUrl = PINATA_CONFIG.apiUrl;
    this.jwt = PINATA_CONFIG.jwt;
  }

  /**
   * Initialize the service (kept for compatibility)
   */
  initialize(account, signer) {
    // No special initialization needed for Pinata
    console.log('Pinata service initialized');
  }

  /**
   * Upload file to Pinata
   */
  async uploadFile(file, options = {}) {
    try {
      if (!this.jwt) {
        throw new Error('Pinata JWT not configured. Please add VITE_PINATA_JWT to your environment variables.');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Add metadata if provided
      if (options.metadata) {
        const metadata = JSON.stringify({
          name: options.name || file.name,
          keyvalues: options.metadata
        });
        formData.append('pinataMetadata', metadata);
      }

      // Add options for pinning
      if (options.pinataOptions) {
        formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
      }

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload to Pinata: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `${this.gateway}/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
        timestamp: result.Timestamp
      };
    } catch (error) {
      console.error('Failed to upload file to Pinata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload JSON metadata to Pinata
   */
  async uploadMetadata(metadata, tokenId) {
    try {
      if (!this.jwt) {
        throw new Error('Pinata JWT not configured. Please add VITE_PINATA_JWT to your environment variables.');
      }

      const response = await fetch(`${this.apiUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwt}`
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `FairBNB-NFT-${tokenId}`,
            keyvalues: {
              tokenId: tokenId.toString(),
              type: 'nft-metadata'
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload metadata to Pinata: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `${this.gateway}/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
        timestamp: result.Timestamp
      };
    } catch (error) {
      console.error('Failed to upload metadata to Pinata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files as a folder to Pinata
   */
  async uploadFolder(files, folderName) {
    try {
      if (!this.jwt) {
        throw new Error('Pinata JWT not configured. Please add VITE_PINATA_JWT to your environment variables.');
      }

      const formData = new FormData();
      
      // Add each file with its relative path
      files.forEach((file, index) => {
        const fileName = file.name || `file-${index}`;
        formData.append('file', file, `${folderName}/${fileName}`);
      });

      // Add metadata
      const metadata = JSON.stringify({
        name: folderName,
        keyvalues: {
          type: 'property-images',
          count: files.length.toString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload folder to Pinata: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `${this.gateway}/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
        timestamp: result.Timestamp
      };
    } catch (error) {
      console.error('Failed to upload folder to Pinata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content from IPFS via Pinata gateway
   */
  async getContent(ipfsHash) {
    try {
      const response = await fetch(`${this.gateway}/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return {
          success: true,
          data,
          contentType
        };
      } else {
        const data = await response.blob();
        return {
          success: true,
          data,
          contentType
        };
      }
    } catch (error) {
      console.error('Failed to get content from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get metadata from IPFS
   */
  async getMetadata(ipfsHash) {
    try {
      const response = await fetch(`${this.gateway}/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return {
        success: true,
        metadata
      };
    } catch (error) {
      console.error('Failed to get metadata from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unpin content from Pinata (delete)
   */
  async unpin(ipfsHash) {
    try {
      if (!this.jwt) {
        throw new Error('Pinata JWT not configured.');
      }

      const response = await fetch(`${this.apiUrl}/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to unpin from Pinata: ${error}`);
      }

      return {
        success: true,
        message: 'Content unpinned successfully'
      };
    } catch (error) {
      console.error('Failed to unpin from Pinata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pinned content list
   */
  async getPinnedList(options = {}) {
    try {
      if (!this.jwt) {
        throw new Error('Pinata JWT not configured.');
      }

      const params = new URLSearchParams();
      if (options.pageLimit) params.append('pageLimit', options.pageLimit);
      if (options.pageOffset) params.append('pageOffset', options.pageOffset);
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          params.append(`metadata[keyvalues][${key}]`, value);
        });
      }

      const response = await fetch(`${this.apiUrl}/data/pinList?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get pinned list: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        count: result.count,
        rows: result.rows
      };
    } catch (error) {
      console.error('Failed to get pinned list:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper to get gateway URL from IPFS URI
   */
  getGatewayUrl(ipfsUri) {
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      return `${this.gateway}/ipfs/${hash}`;
    }
    return ipfsUri;
  }
}

// Export singleton instance
export const pinataService = new PinataService();
