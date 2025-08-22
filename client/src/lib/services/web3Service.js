/**
 * @fileoverview Web3 service for blockchain interactions with FairBNB contract
 */

import { ethers } from 'ethers';
import { FairBNB } from '../../abis/FairBNB.js';

// Contract configuration
const CONTRACT_CONFIG = {
  address: '0x273806d29F1883b1AF5D51fFA6650c4adF26796c',
  network: 'BSC Testnet'
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.contract = null;
    this.isConnected = false;
  }

  /**
   * Initialize Web3 connection
   */
  async initialize() {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.account = accounts[0];

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Initialize FairBNB contract
      this.contract = new ethers.Contract(
        CONTRACT_CONFIG.address,
        FairBNB,
        this.signer
      );

      this.isConnected = true;

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return {
        success: true,
        account: this.account,
        chainId: await this.provider.getNetwork().then(net => net.chainId)
      };
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle account changes
   */
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.disconnect();
    } else if (accounts[0] !== this.account) {
      this.account = accounts[0];
      this.signer = this.provider.getSigner();
    }
  }

  /**
   * Handle chain changes
   */
  handleChainChanged(chainId) {
    window.location.reload();
  }

  /**
   * Disconnect from Web3
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.contract = null;
    this.isConnected = false;
  }

  /**
   * Get current account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Check if connected
   */
  isWeb3Connected() {
    return this.isConnected;
  }

  /**
   * Upload file to IPFS using Pinata
   */
  async uploadToIPFS(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        hash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`
      };
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload metadata to IPFS
   */
  async uploadMetadata(metadata) {
    try {
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: 'application/json'
      });

      const formData = new FormData();
      formData.append('file', metadataBlob, 'metadata.json');

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload metadata to IPFS: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        hash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`
      };
    } catch (error) {
      console.error('Failed to upload metadata to IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mint a new property NFT
   */
  async mintProperty(metadata, imageFile) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      // Upload image to IPFS first
      const imageResult = await this.uploadToIPFS(imageFile);
      if (!imageResult.success) {
        throw new Error(`Failed to upload image: ${imageResult.error}`);
      }

      // Create metadata with image URI
      const propertyMetadata = {
        ...metadata,
        image: imageResult.url,
        attributes: [
          {
            trait_type: "Property Type",
            value: metadata.propertyType
          },
          {
            trait_type: "City",
            value: metadata.city
          },
          {
            trait_type: "State",
            value: metadata.state
          }
        ]
      };

      // Upload metadata to IPFS
      const metadataResult = await this.uploadMetadata(propertyMetadata);
      if (!metadataResult.success) {
        throw new Error(`Failed to upload metadata: ${metadataResult.error}`);
      }

      // Mint NFT with metadata URI
      const tx = await this.contract.mintProperty(metadataResult.url);
      const receipt = await tx.wait();

      // Find the PropertyMinted event
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'PropertyMinted';
        } catch {
          return false;
        }
      });

      if (mintEvent) {
        const parsed = this.contract.interface.parseLog(mintEvent);
        return {
          success: true,
          tokenId: parsed.args.tokenId.toString(),
          tokenURI: parsed.args.uri,
          txnHash: receipt.hash,
          metadataUrl: metadataResult.url,
          imageUrl: imageResult.url
        };
      }

      throw new Error('Mint event not found');
    } catch (error) {
      console.error('Failed to mint property:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List property for rent
   */
  async listProperty(tokenId, rent, deposit, disputeFee) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const tx = await this.contract.listProperty(tokenId, rent, deposit, disputeFee);
      const receipt = await tx.wait();

      // Find the PropertyListed event
      const listEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'PropertyListed';
        } catch {
          return false;
        }
      });

      if (listEvent) {
        const parsed = this.contract.interface.parseLog(listEvent);
        return {
          success: true,
          tokenId: parsed.args.tokenId.toString(),
          rent: parsed.args.rent.toString(),
          deposit: parsed.args.deposit.toString(),
          disputeFee: parsed.args.disputeFee.toString(),
          txnHash: receipt.hash
        };
      }

      throw new Error('List event not found');
    } catch (error) {
      console.error('Failed to list property:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's NFTs (properties owned by connected address)
   */
  async getUserNFTs() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const userTokens = await this.contract.getUserTokens(this.account);
      const nfts = [];

      for (const tokenId of userTokens) {
        try {
          const tokenURI = await this.contract.tokenURI(tokenId);
          const owner = await this.contract.ownerOf(tokenId);
          
          // Get listing details
          const listingDetails = await this.contract.getListingDetails(tokenId);
          
          // Get rental details if exists
          const rentalDetails = await this.contract.getRentalDetails(tokenId);

          nfts.push({
            tokenId: tokenId.toString(),
            tokenURI,
            owner,
            listing: {
              rent: listingDetails.rent.toString(),
              deposit: listingDetails.deposit.toString(),
              disputeFee: listingDetails.disputeFee.toString(),
              isListed: listingDetails.isListed
            },
            rental: {
              landlord: rentalDetails.landlord,
              tenant: rentalDetails.tenant,
              rent: rentalDetails.rent.toString(),
              deposit: rentalDetails.deposit.toString(),
              disputeFee: rentalDetails.disputeFee.toString(),
              isActive: rentalDetails.isActive,
              tenantHappy: rentalDetails.tenantHappy,
              landlordHappy: rentalDetails.landlordHappy,
              isDisputed: rentalDetails.isDisputed
            }
          });
        } catch (error) {
          console.error(`Failed to get details for token ${tokenId}:`, error);
        }
      }

      return {
        success: true,
        nfts
      };
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all available listings
   */
  async getAvailableListings() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const result = await this.contract.getAvailableListings();
      const listings = [];

      for (let i = 0; i < result.availableTokenIds.length; i++) {
        try {
          const tokenId = result.availableTokenIds[i];
          const tokenURI = await this.contract.tokenURI(tokenId);
          const owner = await this.contract.ownerOf(tokenId);

          listings.push({
            tokenId: tokenId.toString(),
            tokenURI,
            landlord: result.landlords[i],
            rent: result.rents[i].toString(),
            deposit: result.deposits[i].toString(),
            disputeFee: result.disputeFees[i].toString()
          });
        } catch (error) {
          console.error(`Failed to get details for listing ${i}:`, error);
        }
      }

      return {
        success: true,
        listings
      };
    } catch (error) {
      console.error('Failed to get available listings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all NFTs with details (for explore page)
   */
  async getAllNFTsWithDetails() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const result = await this.contract.getAllNFTsWithDetails();
      const nfts = [];

      for (let i = 0; i < result.tokenIds.length; i++) {
        try {
          nfts.push({
            tokenId: result.tokenIds[i].toString(),
            owner: result.owners[i],
            tokenURI: result.uris[i],
            isListed: result.isListed[i],
            rent: result.rents[i].toString(),
            deposit: result.deposits[i].toString(),
            isRented: result.isRented[i]
          });
        } catch (error) {
          console.error(`Failed to get details for NFT ${i}:`, error);
        }
      }

      return {
        success: true,
        nfts
      };
    } catch (error) {
      console.error('Failed to get all NFTs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get metadata from IPFS URI
   */
  async getMetadataFromURI(tokenURI) {
    try {
      // Convert ipfs:// to https://gateway.pinata.cloud/ipfs/
      const gatewayUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      
      const response = await fetch(gatewayUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return {
        success: true,
        metadata
      };
    } catch (error) {
      console.error('Failed to get metadata from URI:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rent a property
   */
  async rentProperty(tokenId, totalAmount) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const tx = await this.contract.rentProperty(tokenId, { value: totalAmount });
      const receipt = await tx.wait();

      // Find the PropertyRented event
      const rentEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'PropertyRented';
        } catch {
          return false;
        }
      });

      if (rentEvent) {
        const parsed = this.contract.interface.parseLog(rentEvent);
        return {
          success: true,
          tokenId: parsed.args.tokenId.toString(),
          tenant: parsed.args.tenant,
          totalPaid: parsed.args.totalPaid.toString(),
          txnHash: receipt.hash
        };
      }

      throw new Error('Rent event not found');
    } catch (error) {
      console.error('Failed to rent property:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm happy (either party)
   */
  async confirmHappy(tokenId, isLandlord) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const tx = await this.contract.confirmHappy(tokenId, isLandlord);
      const receipt = await tx.wait();

      return {
        success: true,
        txnHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to confirm happy:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Raise dispute
   */
  async raiseDispute(tokenId) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const tx = await this.contract.raiseDispute(tokenId);
      const receipt = await tx.wait();

      return {
        success: true,
        txnHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to raise dispute:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve dispute (jury function)
   */
  async resolveDispute(tokenId, tenantWins) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const tx = await this.contract.resolveDispute(tokenId, tenantWins);
      const receipt = await tx.wait();

      return {
        success: true,
        txnHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Withdraw accumulated funds
   */
  async withdraw() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const tx = await this.contract.withdraw();
      const receipt = await tx.wait();

      return {
        success: true,
        txnHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to withdraw:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if current user is jury
   */
  async isJury() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const juryAddress = await this.contract.jury();
      return this.account?.toLowerCase() === juryAddress.toLowerCase();
    } catch (error) {
      console.error('Failed to check jury status:', error);
      return false;
    }
  }

  /**
   * Get jury address
   */
  async getJuryAddress() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      return await this.contract.jury();
    } catch (error) {
      console.error('Failed to get jury address:', error);
      return null;
    }
  }

  /**
   * Get pending withdrawal amount for current user
   */
  async getPendingWithdrawal() {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const amount = await this.contract.pendingWithdrawals(this.account);
      return ethers.formatEther(amount);
    } catch (error) {
      console.error('Failed to get pending withdrawal:', error);
      return '0';
    }
  }

  /**
   * Check if dispute has been resolved
   */
  async isDisputeResolved(tokenId) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const rentalDetails = await this.contract.getRentalDetails(tokenId);
      return !rentalDetails.isDisputed && !rentalDetails.isActive;
    } catch (error) {
      console.error('Failed to check dispute status:', error);
      return false;
    }
  }

  /**
   * Get dispute resolution details
   */
  async getDisputeResolution(tokenId) {
    try {
      if (!this.contract) {
        throw new Error('FairBNB contract not initialized');
      }

      const rentalDetails = await this.contract.getRentalDetails(tokenId);
      const listingDetails = await this.contract.getListingDetails(tokenId);
      
      if (!rentalDetails.isDisputed && !rentalDetails.isActive) {
        // Dispute has been resolved
        const juryReward = ethers.formatEther(listingDetails.disputeFee / 2n);
        
        // Determine winner based on who gets the funds
        // This is a simplified logic - in a real implementation, you'd track the resolution
        const tenantWins = rentalDetails.tenant !== '0x0000000000000000000000000000000000000000';
        
        return {
          resolved: true,
          tenantWins,
          juryReward,
          totalDisputeFee: ethers.formatEther(listingDetails.disputeFee)
        };
      }
      
      return { resolved: false };
    } catch (error) {
      console.error('Failed to get dispute resolution:', error);
      return { resolved: false };
    }
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
