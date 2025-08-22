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

    // Enhanced mint property with EITHER Greenfield OR IPFS storage (not both)
    async mintPropertyWithStorage(
        metadata,
        imageFile,
        storageOptions = {}
    ) {
        try {
            // First, ensure web3 is connected
            if (!this.web3Service.isWeb3Connected()) {
                const initResult = await this.web3Service.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.error);
                }
            }

            const {
                useGreenfield = false,
                address,
                provider,
                onImageProgress,
                onMetadataProgress,
            } = storageOptions;

            // For now, let's use the original mintProperty method as fallback
            if (!useGreenfield) {
                // Use the original working method
                return await this.web3Service.mintProperty(metadata, imageFile);
            }

            let imageResult = null;
            let metadataResult = null;
            let storageType = "ipfs"; // Default to IPFS

            if (useGreenfield && address && provider) {
                // Use Greenfield storage
                storageType = "greenfield";

                try {
                    // Upload image to Greenfield
                    const imageObjectName = `property-images/${Date.now()}-${imageFile.name}`;
                    imageResult = await enhancedGreenfieldService.uploadToGreenfield(
                        address,
                        provider,
                        imageFile,
                        imageObjectName,
                        onImageProgress
                    );

                    if (!imageResult.success) {
                        throw new Error(
                            `Greenfield image upload failed: ${imageResult.error}`
                        );
                    }

                    // Create metadata with Greenfield image URL
                    const metadataWithGreenfield = {
                        ...metadata,
                        image: imageResult.greenfieldUrl,
                        storageType: "greenfield",
                        greenfieldImageObjectName: imageObjectName,
                    };

                    // Upload metadata to Greenfield
                    const metadataBlob = new Blob(
                        [JSON.stringify(metadataWithGreenfield)],
                        { type: "application/json" }
                    );
                    const metadataObjectName = `property-metadata/${Date.now()}-metadata.json`;

                    metadataResult = await enhancedGreenfieldService.uploadToGreenfield(
                        address,
                        provider,
                        metadataBlob,
                        metadataObjectName,
                        onMetadataProgress
                    );

                    if (!metadataResult.success) {
                        throw new Error(
                            `Greenfield metadata upload failed: ${metadataResult.error}`
                        );
                    }

                    // Mint NFT with Greenfield metadata URL using web3Service
                    const mintResult = await this.mintNFTWithGreenfieldMetadata(
                        metadataWithGreenfield,
                        metadataResult.greenfieldUrl
                    );

                    return {
                        ...mintResult,
                        storageType: "greenfield",
                        storage: {
                            image: imageResult,
                            metadata: metadataResult,
                        },
                    };
                } catch (greenfieldError) {
                    console.warn(
                        "Greenfield storage failed, falling back to IPFS:",
                        greenfieldError
                    );
                    // Fall through to IPFS storage
                }
            }

            // Use IPFS storage (default or fallback)
            storageType = "ipfs";

            // Upload image to IPFS
            imageResult = await this.web3Service.uploadToIPFS(imageFile);
            if (!imageResult.success) {
                throw new Error(`IPFS image upload failed: ${imageResult.error}`);
            }

            // Create metadata with IPFS image URL
            const metadataWithIPFS = {
                ...metadata,
                image: imageResult.url,
                storageType: "ipfs",
                attributes: [
                    {
                        trait_type: "Property Type",
                        value: metadata.propertyType,
                    },
                    {
                        trait_type: "City",
                        value: metadata.city,
                    },
                    {
                        trait_type: "State",
                        value: metadata.state,
                    },
                ],
            };

            // Upload metadata to IPFS
            metadataResult = await this.web3Service.uploadMetadata(metadataWithIPFS);
            if (!metadataResult.success) {
                throw new Error(`IPFS metadata upload failed: ${metadataResult.error}`);
            }

            // Mint NFT with IPFS metadata URL using web3Service
            const mintResult = await this.web3Service.mintProperty(metadata, imageFile);

            return {
                ...mintResult,
                storageType: "ipfs",
                storage: {
                    image: imageResult,
                    metadata: metadataResult,
                },
            };
        } catch (error) {
            console.error("Enhanced mint property failed:", error);
            return {
                success: false,
                error: error.message,
                storageType: storageOptions.useGreenfield ? "greenfield" : "ipfs",
            };
        }
    }

    // Helper method to mint NFT with Greenfield metadata URL
    async mintNFTWithGreenfieldMetadata(metadata, metadataURI) {
        try {
            if (!this.web3Service.contract) {
                throw new Error("FairBNB contract not initialized");
            }

            console.log("Minting NFT with Greenfield metadata URI:", metadataURI);

            // Get the current account
            const account = this.web3Service.getAccount();
            if (!account) {
                throw new Error("No account connected");
            }

            // Call mintProperty directly on the contract with the metadata URI
            const tx = await this.web3Service.contract.mintProperty(metadataURI);

            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("Transaction receipt:", receipt);

            // Find the PropertyMinted event
            let mintEvent = receipt.logs.find((log) => {
                try {
                    const parsed = this.web3Service.contract.interface.parseLog(log);
                    return parsed.name === "PropertyMinted";
                } catch {
                    return false;
                }
            });

            if (mintEvent) {
                const parsed = this.web3Service.contract.interface.parseLog(mintEvent);
                const tokenId = parsed.args.tokenId.toString();

                return {
                    success: true,
                    tokenId: tokenId,
                    tokenURI: parsed.args.uri || metadataURI,
                    txnHash: receipt.hash,
                    metadataUrl: metadataURI,
                };
            }

            throw new Error("PropertyMinted event not found in transaction receipt");
        } catch (error) {
            console.error("Failed to mint NFT with Greenfield:", error);

            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.code === "UNKNOWN_ERROR" && error.error?.message) {
                errorMessage = error.error.message;
            } else if (error.reason) {
                errorMessage = error.reason;
            } else if (error.message.includes("Internal JSON-RPC error")) {
                errorMessage = "Contract call failed. Please check your wallet connection and try again.";
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    // Backwards compatibility: Keep the original method name but delegate to new implementation
    async mintPropertyWithGreenfield(metadata, imageFile, greenfieldOptions = {}) {
        return this.mintPropertyWithStorage(metadata, imageFile, {
            useGreenfield: true,
            ...greenfieldOptions,
        });
    }

    // Method to get storage details for a property
    async getPropertyStorageInfo(tokenURI) {
        try {
            // Try to fetch metadata from the URI
            const metadataResult = await this.web3Service.getMetadataFromURI(tokenURI);
            if (metadataResult.success) {
                const metadata = metadataResult.metadata;
                return {
                    success: true,
                    storageType: metadata.storageType || "ipfs",
                    metadata: metadata,
                    imageUrl: metadata.image,
                };
            }
            return metadataResult;
        } catch (error) {
            return { success: false, error: error.message };
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

    // Delegate other methods to web3Service for compatibility
    async getUserNFTs() {
        return this.web3Service.getUserNFTs();
    }

    async getAvailableListings() {
        return this.web3Service.getAvailableListings();
    }

    async getAllNFTsWithDetails() {
        return this.web3Service.getAllNFTsWithDetails();
    }

    async rentProperty(tokenId, totalAmount) {
        return this.web3Service.rentProperty(tokenId, totalAmount);
    }

    async confirmHappy(tokenId, isLandlord) {
        return this.web3Service.confirmHappy(tokenId, isLandlord);
    }

    async raiseDispute(tokenId) {
        return this.web3Service.raiseDispute(tokenId);
    }

    async resolveDispute(tokenId, tenantWins) {
        return this.web3Service.resolveDispute(tokenId, tenantWins);
    }

    async withdraw() {
        return this.web3Service.withdraw();
    }
}

export const enhancedWeb3Service = EnhancedWeb3Service.getInstance();