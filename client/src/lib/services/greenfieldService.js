/**
 * @fileoverview BNB Greenfield service for storage operations - SDK Integration
 */

import { Client, Long, VisibilityType } from "@bnb-chain/greenfield-js-sdk";

// BNB Greenfield Configuration - Same as bnbgf
const GREENFIELD_CONFIG = {
    grpcUrl: "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org",
    rpcUrl: "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org",
    chainId: "5600",
    bucketName: "hellotoys",
};

class GreenfieldService {
    constructor() {
        this.client = null;
        this.account = null;
        this.provider = null;
        this.bucketCreated = false;
        this.offChainData = null;
        this.selectedSp = null;
    }

    /**
     * Initialize the service with SDK client
     */
    async initialize(account, provider) {
        try {
            this.account = account;
            this.provider = provider;

            // Create Greenfield client
            this.client = Client.create(
                GREENFIELD_CONFIG.grpcUrl,
                GREENFIELD_CONFIG.chainId
            );

            // Get storage providers
            await this.setupStorageProvider();

            // Setup off-chain auth
            await this.setupOffChainAuth();

            return { success: true };
        } catch (error) {
            console.warn("Greenfield initialization failed:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup storage provider - same as bnbgf
     */
    async setupStorageProvider() {
        try {
            const sps = await this.client.sp.getStorageProviders();
            const finalSps = (sps ?? []).filter((v) =>
                v.endpoint.includes("nodereal")
            );

            if (finalSps.length === 0) {
                throw new Error("No storage providers available");
            }

            const selectIndex = Math.floor(Math.random() * finalSps.length);
            const secondarySpAddresses = [
                ...finalSps.slice(0, selectIndex),
                ...finalSps.slice(selectIndex + 1),
            ].map((item) => item.operatorAddress);

            this.selectedSp = {
                id: finalSps[selectIndex].id,
                endpoint: finalSps[selectIndex].endpoint,
                primarySpAddress: finalSps[selectIndex]?.operatorAddress,
                sealAddress: finalSps[selectIndex].sealAddress,
                secondarySpAddresses,
            };

            console.log("Selected SP:", this.selectedSp);
        } catch (error) {
            console.warn("Failed to setup storage provider:", error);
            throw error;
        }
    }

    /**
     * Setup off-chain authentication - same as bnbgf
     */
    async setupOffChainAuth() {
        try {
            const storageKey = `greenfield_auth_${this.account}`;
            const storageResStr = localStorage.getItem(storageKey);

            if (storageResStr) {
                const storageRes = JSON.parse(storageResStr);
                if (storageRes.expirationTime > Date.now()) {
                    this.offChainData = storageRes;
                    return;
                } else {
                    localStorage.removeItem(storageKey);
                }
            }

            // Get all SPs for auth
            const sps = await this.client.sp.getStorageProviders();
            const allSps = (sps ?? [])
                .filter((v) => v.endpoint.includes("nodereal"))
                .map((sp) => ({
                    address: sp.operatorAddress,
                    endpoint: sp.endpoint,
                    name: sp.description?.moniker,
                }));

            const offchainAuthRes =
                await this.client.offchainauth.genOffChainAuthKeyPairAndUpload(
                    {
                        sps: allSps,
                        chainId: GREENFIELD_CONFIG.chainId,
                        expirationMs: 5 * 24 * 60 * 60 * 1000, // 5 days
                        domain: window.location.origin,
                        address: this.account,
                    },
                    this.provider
                );

            const { code, body: offChainData } = offchainAuthRes;
            if (code !== 0 || !offChainData) {
                throw new Error("Failed to generate off-chain auth keys");
            }

            localStorage.setItem(storageKey, JSON.stringify(offChainData));
            this.offChainData = offChainData;

            console.log("Off-chain auth setup complete");
        } catch (error) {
            console.warn("Failed to setup off-chain auth:", error);
            throw error;
        }
    }

    /**
     * Ensure bucket exists - same as bnbgf
     */
    async ensureBucketExists() {
        try {
            if (this.bucketCreated) {
                return {
                    success: true,
                    bucketName: GREENFIELD_CONFIG.bucketName,
                };
            }

            if (!this.client || !this.selectedSp || !this.offChainData) {
                throw new Error("Greenfield not properly initialized");
            }

            // Try to create bucket
            const createBucketTx = await this.client.bucket.createBucket({
                bucketName: GREENFIELD_CONFIG.bucketName,
                creator: this.account,
                primarySpAddress: this.selectedSp.primarySpAddress,
                visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
                chargedReadQuota: Long.fromString("0"),
                paymentAddress: this.account,
            });

            const simulateInfo = await createBucketTx.simulate({
                denom: "BNB",
            });

            const res = await createBucketTx.broadcast({
                denom: "BNB",
                gasLimit: Number(simulateInfo?.gasLimit),
                gasPrice: simulateInfo?.gasPrice || "5000000000",
                payer: this.account,
                granter: "",
            });

            if (res.code === 0) {
                this.bucketCreated = true;
                console.log("Bucket created successfully");
            }

            return { success: true, bucketName: GREENFIELD_CONFIG.bucketName };
        } catch (error) {
            // Bucket might already exist, which is fine
            console.warn(
                "Bucket creation warning (might already exist):",
                error.message
            );
            this.bucketCreated = true;
            return { success: true, bucketName: GREENFIELD_CONFIG.bucketName };
        }
    }

    /**
     * Upload file using delegate upload - same as bnbgf
     */
    async uploadFile(file, objectName) {
        try {
            if (!this.client || !this.offChainData) {
                throw new Error("Greenfield not properly initialized");
            }

            await this.ensureBucketExists();

            const res = await this.client.object.delegateUploadObject(
                {
                    bucketName: GREENFIELD_CONFIG.bucketName,
                    objectName: objectName,
                    body: file,
                    delegatedOpts: {
                        visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
                    },
                    onProgress: (e) => {
                        console.log("Greenfield upload progress:", e.percent);
                    },
                },
                {
                    type: "EDDSA",
                    address: this.account,
                    domain: window.location.origin,
                    seed: this.offChainData.seedString,
                }
            );

            if (res.code === 0) {
                return {
                    success: true,
                    url: `greenfield://${GREENFIELD_CONFIG.bucketName}/${objectName}`,
                    objectName: objectName,
                };
            } else {
                throw new Error(`Upload failed with code: ${res.code}`);
            }
        } catch (error) {
            console.warn("Greenfield upload failed:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Upload metadata JSON to Greenfield
     */
    async uploadMetadata(metadata, tokenId) {
        try {
            const metadataJson = JSON.stringify(metadata, null, 2);
            const blob = new Blob([metadataJson], { type: "application/json" });
            const file = new File([blob], "metadata.json");
            const objectName = `metadata/${tokenId}/metadata.json`;

            return await this.uploadFile(file, objectName);
        } catch (error) {
            console.warn("Failed to upload metadata to Greenfield:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Upload image to Greenfield
     */
    async uploadImage(imageFile, tokenId) {
        try {
            const fileExtension = imageFile.name.split(".").pop();
            const objectName = `images/${tokenId}/image.${fileExtension}`;

            return await this.uploadFile(imageFile, objectName);
        } catch (error) {
            console.warn("Failed to upload image to Greenfield:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Download file from Greenfield
     */
    async downloadFile(objectName) {
        try {
            if (!this.client || !this.offChainData) {
                throw new Error("Greenfield not properly initialized");
            }

            const res = await this.client.object.downloadFile(
                {
                    bucketName: GREENFIELD_CONFIG.bucketName,
                    objectName: objectName,
                },
                {
                    type: "EDDSA",
                    address: this.account,
                    domain: window.location.origin,
                    seed: this.offChainData.seedString,
                }
            );

            return {
                success: true,
                data: res,
            };
        } catch (error) {
            console.warn("Failed to download from Greenfield:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get public URL for object
     */
    getPublicUrl(objectName) {
        if (!this.selectedSp) {
            return null;
        }
        return `${this.selectedSp.endpoint}/${GREENFIELD_CONFIG.bucketName}/${objectName}`;
    }
}

// Export singleton instance
export const greenfieldService = new GreenfieldService();
