/**
 * @fileoverview Web3 service for blockchain interactions
 */

import { ethers } from 'ethers';
import { greenfieldService } from './greenfieldService.js';

// Contract ABIs
import { RentalNFTABI } from '../../abis/RentalNFT.js';
import { EscrowABI } from '../../abis/IntegratedEscrow.js';

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
  bucketName: 'test-fairbnb',  // Updated to match greenfieldService
  primarySPAddress: '0x5ccF0F6b78a37Ef4e2CcBC10D155c28Fb8bE9BaF'
};

// Contract addresses (update these after deployment)
const CONTRACT_ADDRESSES = {
  rentalNFT: '0x2FF6361D8221936a9ba365101A963154078C18C3',
  integratedEscrow: '0xFC1b28D658F2B4db2Ef9A40fE18ac1419bdBe322'
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.rentalNFTContract = null;
    this.escrowContract = null;
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

      // Initialize Greenfield service
      greenfieldService.initialize(this.account, this.signer);

      // Initialize contracts
      this.rentalNFTContract = new ethers.Contract(
        CONTRACT_ADDRESSES.rentalNFT,
        RentalNFTABI,
        this.signer
      );

      this.escrowContract = new ethers.Contract(
        CONTRACT_ADDRESSES.integratedEscrow,
        EscrowABI,
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
      greenfieldService.initialize(this.account, this.signer);
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
    this.rentalNFTContract = null;
    this.escrowContract = null;
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
   * Upload file to BNB Greenfield
   */
  async uploadToGreenfield(file, path) {
    try {
      // Ensure bucket exists
      const bucketResult = await greenfieldService.ensureBucketExists();
      if (!bucketResult.success) {
        throw new Error(`Failed to ensure bucket exists: ${bucketResult.error}`);
      }

      // Upload file
      const uploadResult = await greenfieldService.uploadObject(
        GREENFIELD_CONFIG.bucketName,
        path,
        file
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to upload file: ${uploadResult.error}`);
      }

      return {
        success: true,
        url: uploadResult.url,
        publicUrl: greenfieldService.getPublicUrl(GREENFIELD_CONFIG.bucketName, path)
      };
    } catch (error) {
      console.error('Failed to upload to Greenfield:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload metadata to BNB Greenfield
   */
  async uploadMetadata(metadata, tokenId) {
    try {
      return await greenfieldService.uploadMetadata(metadata, tokenId);
    } catch (error) {
      console.error('Failed to upload metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mint a new rental NFT
   */
  async mintRentalNFT(metadata) {
    try {
      if (!this.rentalNFTContract) {
        throw new Error('RentalNFT contract not initialized');
      }

      // Generate token ID
      const tokenId = await this.rentalNFTContract.getCurrentTokenId();
      
      // Upload metadata to Greenfield
      const metadataResult = await this.uploadMetadata(metadata, tokenId.toString());
      if (!metadataResult.success) {
        throw new Error(`Failed to upload metadata: ${metadataResult.error}`);
      }

      // Mint NFT with the metadata URI
      const tx = await this.rentalNFTContract.mint(
        this.account,
        metadataResult.url
      );

      const receipt = await tx.wait();
      
      // Find the mint event
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = this.rentalNFTContract.interface.parseLog(log);
          return parsed.name === 'PropertyMinted';
        } catch {
          return false;
        }
      });

      if (mintEvent) {
        const parsed = this.rentalNFTContract.interface.parseLog(mintEvent);
        return {
          success: true,
          tokenId: parsed.args.tokenId.toString(),
          tokenURI: parsed.args.tokenURI,
          txnHash: receipt.hash,
          metadataUrl: metadataResult.url
        };
      }

      throw new Error('Mint event not found');
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a rental agreement
   */
  async createRentalAgreement(params) {
    try {
      if (!this.escrowContract) {
        throw new Error('Escrow contract not initialized');
      }

      const totalAmount = params.rentAmount + params.depositAmount + params.disputeFee;

      const tx = await this.escrowContract.createAgreement(params, {
        value: totalAmount
      });

      const receipt = await tx.wait();
      
      // Find the agreement created event
      const agreementEvent = receipt.logs.find(log => {
        try {
          const parsed = this.escrowContract.interface.parseLog(log);
          return parsed.name === 'AgreementCreated';
        } catch {
          return false;
        }
      });

      if (agreementEvent) {
        const parsed = this.escrowContract.interface.parseLog(agreementEvent);
        return {
          success: true,
          agreementId: parsed.args.agreementId.toString(),
          txnHash: receipt.hash
        };
      }

      throw new Error('Agreement event not found');
    } catch (error) {
      console.error('Failed to create rental agreement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's rental NFTs
   */
  async getUserNFTs() {
    try {
      if (!this.rentalNFTContract) {
        throw new Error('RentalNFT contract not initialized');
      }

      // Get balance
      const balance = await this.rentalNFTContract.balanceOf(this.account);
      const nfts = [];

      // Get all tokens owned by user
      for (let i = 0; i < balance; i++) {
        const tokenId = await this.rentalNFTContract.tokenOfOwnerByIndex(this.account, i);
        const tokenURI = await this.rentalNFTContract.tokenURI(tokenId);
        
        // Fetch metadata from Greenfield
        const metadataResult = await this.getMetadataFromURI(tokenURI);
        
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI,
          metadata: metadataResult.success ? metadataResult.metadata : null
        });
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
   * Get user's rental agreements
   */
  async getUserAgreements() {
    try {
      if (!this.escrowContract) {
        throw new Error('Escrow contract not initialized');
      }

      const tenantAgreements = await this.escrowContract.getTenantAgreements(this.account);
      const landlordAgreements = await this.escrowContract.getLandlordAgreements(this.account);

      const agreements = [];

      // Get tenant agreements
      for (const agreementId of tenantAgreements) {
        const agreement = await this.escrowContract.getAgreementDetails(agreementId);
        agreements.push({
          id: agreementId.toString(),
          ...agreement,
          role: 'tenant'
        });
      }

      // Get landlord agreements
      for (const agreementId of landlordAgreements) {
        const agreement = await this.escrowContract.getAgreementDetails(agreementId);
        agreements.push({
          id: agreementId.toString(),
          ...agreement,
          role: 'landlord'
        });
      }

      return {
        success: true,
        agreements
      };
    } catch (error) {
      console.error('Failed to get user agreements:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stake as juror
   */
  async stakeAsJuror(amount) {
    try {
      if (!this.escrowContract) {
        throw new Error('Escrow contract not initialized');
      }

      const tx = await this.escrowContract.stakeAsJuror({
        value: amount
      });

      const receipt = await tx.wait();
      return {
        success: true,
        txnHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to stake as juror:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get juror statistics
   */
  async getJurorStats() {
    try {
      if (!this.escrowContract) {
        throw new Error('Escrow contract not initialized');
      }

      const stats = await this.escrowContract.getJurorStats(this.account);
      return {
        success: true,
        stats: {
          stakedAmount: stats.stakedAmount.toString(),
          disputesAssigned: stats.disputesAssigned.toString(),
          disputesVoted: stats.disputesVoted.toString(),
          correctVotes: stats.correctVotes.toString(),
          totalEarned: stats.totalEarned.toString(),
          isActive: stats.isActive
        }
      };
    } catch (error) {
      console.error('Failed to get juror stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get metadata from Greenfield URI
   */
  async getMetadataFromURI(tokenURI) {
    try {
      // Extract object path from greenfield:// URL
      const urlParts = tokenURI.replace('greenfield://', '').split('/');
      const bucketName = urlParts[0];
      const objectName = urlParts.slice(1).join('/');

      const result = await greenfieldService.getObject(bucketName, objectName);
      if (!result.success) {
        throw new Error(`Failed to fetch metadata: ${result.error}`);
      }

      const metadataText = await result.data.text();
      const metadata = JSON.parse(metadataText);

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
}

// Export singleton instance
export const web3Service = new Web3Service();
