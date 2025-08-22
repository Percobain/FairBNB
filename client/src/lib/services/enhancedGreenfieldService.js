import { client, selectSp, getAllSps } from "../client/greenfieldClient.js";
import { GREEN_CHAIN_ID } from "../../config/env.js";
import { Long, VisibilityType } from "@bnb-chain/greenfield-js-sdk";

// Enhanced service that combines IPFS and Greenfield
export class EnhancedGreenfieldService {
    constructor() {
        this.hardcodedBucket = {
            BucketInfo: {
                BucketName: "hellotoys",
                Owner: "0x9f4e0E3B9F1d6d1dbA403128B8ECFc25794a6e14",
                Id: "0x00000000000000000000000000000000000000000000000000000000000056c0",
                CreateAt: "1724346900",
                Visibility: 2, // Public read
                PrimarySpAddress: "0x2a15da875b1bA0F82eb3A67ae027f5844915bA5a",
                PaymentAddress: "0x9f4e0E3B9F1d6d1dbA403128B8ECFc25794a6e14",
            },
        };
    }

    static getInstance() {
        if (!EnhancedGreenfieldService.instance) {
            EnhancedGreenfieldService.instance =
                new EnhancedGreenfieldService();
        }
        return EnhancedGreenfieldService.instance;
    }

    /**
     * Get off-chain authentication keys
     */
    async getOffchainAuthKeys(address, provider) {
        const storageResStr = localStorage.getItem(address);

        if (storageResStr) {
            const storageRes = JSON.parse(storageResStr);
            if (storageRes.expirationTime < Date.now()) {
                localStorage.removeItem(address);
                throw new Error("Auth key expired, please generate a new one");
            }
            return storageRes;
        }

        const allSps = await getAllSps();
        const offchainAuthRes =
            await client.offchainauth.genOffChainAuthKeyPairAndUpload(
                {
                    sps: allSps,
                    chainId: GREEN_CHAIN_ID,
                    expirationMs: 5 * 24 * 60 * 60 * 1000, // 5 days
                    domain: window.location.origin,
                    address,
                },
                provider
            );

        const { code, body: offChainData } = offchainAuthRes;
        if (code !== 0 || !offChainData) {
            throw offchainAuthRes;
        }

        localStorage.setItem(address, JSON.stringify(offChainData));
        return offChainData;
    }

    /**
     * Upload file to Greenfield (parallel to IPFS)
     */
    async uploadToGreenfield(address, provider, file, objectName, onProgress) {
        try {
            const offChainData = await this.getOffchainAuthKeys(
                address,
                provider
            );

            const res = await client.object.delegateUploadObject(
                {
                    bucketName: this.hardcodedBucket.BucketInfo.BucketName,
                    objectName: objectName,
                    body: file,
                    delegatedOpts: {
                        visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
                    },
                    onProgress: (e) => {
                        onProgress?.({
                            percent: e.percent,
                            loaded: e.loaded,
                            total: e.total,
                        });
                    },
                },
                {
                    type: "EDDSA",
                    address: address,
                    domain: window.location.origin,
                    seed: offChainData.seedString,
                }
            );

            if (res.code === 0) {
                return {
                    success: true,
                    objectId: res.body || "uploaded",
                    greenfieldUrl: `https://gnfd-testnet-sp1.bnbchain.org/view/${this.hardcodedBucket.BucketInfo.BucketName}/${objectName}`,
                };
            } else {
                return {
                    success: false,
                    error: `Upload failed: ${res.message}`,
                };
            }
        } catch (error) {
            console.error("Greenfield upload error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    /**
     * Download file from Greenfield
     */
    async downloadFromGreenfield(address, provider, objectName) {
        try {
            const offChainData = await this.getOffchainAuthKeys(
                address,
                provider
            );

            const res = await client.object.downloadFile(
                {
                    bucketName: this.hardcodedBucket.BucketInfo.BucketName,
                    objectName,
                },
                {
                    type: "EDDSA",
                    address,
                    domain: window.location.origin,
                    seed: offChainData.seedString,
                }
            );

            return { success: true, data: res };
        } catch (error) {
            console.error("Greenfield download error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    /**
     * List objects in bucket
     */
    async listObjects(address) {
        try {
            const res = await client.object.listObjects({
                bucketName: this.hardcodedBucket.BucketInfo.BucketName,
            });

            if (res && res.body) {
                return { success: true, objects: res.body };
            } else if (Array.isArray(res)) {
                return { success: true, objects: res };
            } else {
                return { success: true, objects: [] };
            }
        } catch (error) {
            console.error("List objects error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    getHardcodedBucket() {
        return this.hardcodedBucket;
    }
}

export const enhancedGreenfieldService =
    EnhancedGreenfieldService.getInstance();
