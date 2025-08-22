/**
 * @fileoverview Dispute service for handling case uploads and management
 */

class DisputeService {
  /**
   * Upload dispute case with evidence to IPFS
   */
  async uploadDisputeCase(propertyId, role, caseData, evidenceFiles) {
    try {
      // Upload evidence files first
      const evidenceUrls = [];
      
      for (const file of evidenceFiles) {
        const uploadResult = await this.uploadToIPFSWithFolder(file, 'disputes');
        if (!uploadResult.success) {
          throw new Error(`Failed to upload evidence: ${uploadResult.error}`);
        }
        evidenceUrls.push(uploadResult.url);
      }

      // Create case metadata
      const caseMetadata = {
        propertyId: propertyId,
        role: role,
        title: caseData.title,
        claimSummary: caseData.claimSummary,
        detailedStatement: caseData.detailedStatement,
        evidence: evidenceUrls,
        submittedBy: this.getCurrentAccount(),
        submittedAt: new Date().toISOString(),
        caseType: 'dispute'
      };

      // Upload case metadata to IPFS in disputes folder
      const metadataResult = await this.uploadMetadataWithFolder(caseMetadata, 'disputes');
      if (!metadataResult.success) {
        throw new Error(`Failed to upload case metadata: ${metadataResult.error}`);
      }

      return {
        success: true,
        caseHash: metadataResult.hash,
        caseUrl: metadataResult.url,
        evidenceUrls: evidenceUrls
      };
    } catch (error) {
      console.error('Failed to upload dispute case:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload file to IPFS with folder structure
   */
  async uploadToIPFSWithFolder(file, folderName) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata to organize in folder
      const metadata = JSON.stringify({
        name: `${folderName}/${file.name}`,
        keyvalues: {
          folder: folderName,
          type: 'evidence'
        }
      });
      formData.append('pinataMetadata', metadata);

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
      console.error('Failed to upload to IPFS with folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload metadata to IPFS with folder structure
   */
  async uploadMetadataWithFolder(metadata, folderName) {
    try {
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json'
      });

      const fileName = `${metadata.role}_case_${metadata.propertyId}_${Date.now()}.json`;
      
      const formData = new FormData();
      formData.append('file', metadataBlob, fileName);

      // Add metadata to organize in folder
      const pinataMetadata = JSON.stringify({
        name: `${folderName}/${fileName}`,
        keyvalues: {
          folder: folderName,
          propertyId: metadata.propertyId,
          role: metadata.role,
          type: 'case_metadata'
        }
      });
      formData.append('pinataMetadata', pinataMetadata);

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
      console.error('Failed to upload metadata to IPFS with folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dispute case from IPFS
   */
  async getDisputeCase(ipfsUrl) {
    try {
      const gatewayUrl = ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      
      const response = await fetch(gatewayUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch case: ${response.statusText}`);
      }

      const caseData = await response.json();
      return {
        success: true,
        case: caseData
      };
    } catch (error) {
      console.error('Failed to get dispute case:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if current user is a jury member
   */
  isJuryMember() {
    const currentAccount = this.getCurrentAccount();
    // In a real implementation, this would check against a list of jury members
    // For now, we'll use a hardcoded jury address from the contract
    const juryAddress = '0x0729a81A995Bed60F4F6C5Ec960bEd999740e160';
    return currentAccount.toLowerCase() === juryAddress.toLowerCase();
  }

  /**
   * Get current account from web3
   */
  getCurrentAccount() {
    // Try to get from window.ethereum if available
    if (window.ethereum && window.ethereum.selectedAddress) {
      return window.ethereum.selectedAddress;
    }
    return '0x0000000000000000000000000000000000000000';
  }
}

// Export singleton instance
export const disputeService = new DisputeService();
