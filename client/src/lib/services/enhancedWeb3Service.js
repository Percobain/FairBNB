import { web3Service } from "./web3Service.js";
import { enhancedGreenfieldService } from "./enhancedGreenfieldService.js";

export class EnhancedWeb3Service {
    constructor() {
        this.web3Service = web3Service;
    }

    static getInstance() {
        if (!EnhancedWeb3Service.instance) {
            EnhancedWeb3Service.instance = new EnhancedWeb3Service();
        }
        return EnhancedWeb3Service.instance;
    }

    // Delegate all existing methods to web3Service
    async initialize() {
        return this.web3Service.initialize();
    }

    isWeb3Connected() {
        return this.web3Service.isWeb3Connected();
    }

    async listProperty(...args) {
        return this.web3Service.listProperty(...args);
    }

    // Enhanced mint property that also uploads to Greenfield
    async mintPropertyWithGreenfield(
        metadata,
        imageFile,
        greenfieldOptions = {}
    ) {
        try {
            // First, ensure web3 is connected
            if (!this.web3Service.isWeb3Connected()) {
                const initResult = await this.web3Service.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.error);
                }
            }

            // Get the current account and provider for Greenfield
            const { address, provider } = greenfieldOptions;

            let greenfieldImageResult = null;
            let greenfieldMetadataResult = null;

            // Parallel upload to both IPFS and Greenfield (if options provided)
            const promises = [
                // Always upload to IPFS (original functionality)
                this.web3Service.mintProperty(metadata, imageFile),
            ];

            // Optionally upload to Greenfield as well
            if (address && provider) {
                const imageObjectName = `property-images/${Date.now()}-${
                    imageFile.name
                }`;

                promises.push(
                    // Upload image to Greenfield
                    enhancedGreenfieldService
                        .uploadToGreenfield(
                            address,
                            provider,
                            imageFile,
                            imageObjectName,
                            greenfieldOptions.onImageProgress
                        )
                        .then((result) => {
                            greenfieldImageResult = result;

                            // Create and upload metadata to Greenfield
                            if (result.success) {
                                const metadataWithGreenfield = {
                                    ...metadata,
                                    greenfieldImage: result.greenfieldUrl,
                                    greenfieldImageObjectName: imageObjectName,
                                };

                                const metadataBlob = new Blob(
                                    [JSON.stringify(metadataWithGreenfield)],
                                    {
                                        type: "application/json",
                                    }
                                );

                                const metadataObjectName = `property-metadata/${Date.now()}-metadata.json`;

                                return enhancedGreenfieldService.uploadToGreenfield(
                                    address,
                                    provider,
                                    metadataBlob,
                                    metadataObjectName,
                                    greenfieldOptions.onMetadataProgress
                                );
                            }
                            return {
                                success: false,
                                error: "Image upload failed",
                            };
                        })
                        .then((metaResult) => {
                            greenfieldMetadataResult = metaResult;
                        })
                );
            }

            // Wait for all uploads to complete
            const results = await Promise.allSettled(promises);

            // Get the main NFT result
            const nftResult = results[0];
            if (nftResult.status === "rejected") {
                throw new Error(`NFT minting failed: ${nftResult.reason}`);
            }

            const mintResult = nftResult.value;
            if (!mintResult.success) {
                throw new Error(mintResult.error);
            }

            // Add Greenfield information to the result if available
            const enhancedResult = {
                ...mintResult,
                greenfield: {
                    image: greenfieldImageResult,
                    metadata: greenfieldMetadataResult,
                    enabled: !!(address && provider),
                },
            };

            return enhancedResult;
        } catch (error) {
            console.error("Enhanced mint property failed:", error);
            return {
                success: false,
                error: error.message,
                greenfield: {
                    image: greenfieldImageResult,
                    metadata: greenfieldMetadataResult,
                    enabled: !!(
                        greenfieldOptions.address && greenfieldOptions.provider
                    ),
                },
            };
        }
    }

    // Method to get Greenfield objects for a property
    async getPropertyFromGreenfield(address, provider) {
        if (!address || !provider) {
            return { success: false, error: "Address and provider required" };
        }

        try {
            return await enhancedGreenfieldService.listObjects(address);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export const enhancedWeb3Service = EnhancedWeb3Service.getInstance();
