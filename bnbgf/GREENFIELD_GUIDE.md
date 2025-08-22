# BNB Greenfield Integration Guide

This guide explains how the BNB Greenfield integration works in your project and how to implement it in your own applications.

## Overview

BNB Greenfield is a decentralized storage network built on the BNB Chain. It provides S3-compatible storage with blockchain-based access control and payment mechanisms.

## Key Components

### 1. Client Setup (`src/client/index.ts`)

The Greenfield client is initialized with the GRPC URL and chain ID:

```typescript
import { Client } from '@bnb-chain/greenfield-js-sdk';

export const client = Client.create(GRPC_URL, String(GREEN_CHAIN_ID));
```

### 2. Storage Provider Selection

The system automatically selects storage providers (SPs) from the Greenfield network:

```typescript
export const getSps = async () => {
  const sps = await client.sp.getStorageProviders();
  const finalSps = (sps ?? []).filter((v) => v.endpoint.includes('nodereal'));
  return finalSps;
};
```

### 3. Off-Chain Authentication

Before any operations, the system generates off-chain authentication keys that are stored in localStorage:

```typescript
export const getOffchainAuthKeys = async (address: string, provider: any) => {
  // Check if keys exist in localStorage
  const storageResStr = localStorage.getItem(address);
  
  if (storageResStr) {
    const storageRes = JSON.parse(storageResStr);
    if (storageRes.expirationTime < Date.now()) {
      localStorage.removeItem(address);
      return;
    }
    return storageRes;
  }

  // Generate new keys
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

  localStorage.setItem(address, JSON.stringify(offchainAuthRes.body));
  return offchainAuthRes.body;
};
```

## Core Operations

### 1. Creating Buckets

Buckets are created through a blockchain transaction:

```typescript
// 1. Get storage provider info
const spInfo = await selectSp();

// 2. Get off-chain auth keys
const provider = await connector?.getProvider();
const offChainData = await getOffchainAuthKeys(address, provider);

// 3. Create bucket transaction
const createBucketTx = await client.bucket.createBucket({
  bucketName: info.bucketName,
  creator: address,
  primarySpAddress: spInfo.primarySpAddress,
  visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  chargedReadQuota: Long.fromString('0'),
  paymentAddress: address,
});

// 4. Simulate transaction
const simulateInfo = await createBucketTx.simulate({
  denom: 'BNB',
});

// 5. Broadcast transaction
const res = await createBucketTx.broadcast({
  denom: 'BNB',
  gasLimit: Number(simulateInfo?.gasLimit),
  gasPrice: simulateInfo?.gasPrice || '5000000000',
  payer: address,
  granter: '',
});
```

### 2. Uploading Files

Files are uploaded using delegated upload:

```typescript
const res = await client.object.delegateUploadObject({
  bucketName: info.bucketName,
  objectName: info.objectName,
  body: info.file,
  delegatedOpts: {
    visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  },
  onProgress: (e: OnProgressEvent) => {
    console.log('progress: ', e.percent);
  },
}, {
  type: 'EDDSA',
  address: address,
  domain: window.location.origin,
  seed: offChainData.seedString,
});
```

### 3. Downloading Files

Files are downloaded using:

```typescript
const res = await client.object.downloadFile({
  bucketName,
  objectName,
}, {
  type: 'EDDSA',
  address,
  domain: window.location.origin,
  seed: offChainData.seedString,
});
```

## Implementation Guide

### 1. Environment Setup

Create a `.env` file with the following variables:

```env
VITE_GRPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
VITE_GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
VITE_GREEN_CHAIN_ID=5600
VITE_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
VITE_BSC_CHAIN_ID=97
```

### 2. Install Dependencies

```bash
npm install @bnb-chain/greenfield-js-sdk @rainbow-me/rainbowkit wagmi viem
```

### 3. Using the Service Layer

The project includes a comprehensive service layer (`src/utils/greenfieldService.ts`) that encapsulates all Greenfield operations:

```typescript
import { greenfieldService } from '@/utils/greenfieldService';

// Create a bucket
const result = await greenfieldService.createBucket(
  {
    bucketName: 'my-bucket',
    creator: address,
    visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  },
  address,
  provider,
  (progress) => console.log('Progress:', progress)
);

// Upload a file
const uploadResult = await greenfieldService.uploadFile(
  {
    bucketName: 'my-bucket',
    objectName: 'my-file.txt',
    file: fileObject,
    visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  },
  address,
  provider,
  (progress) => console.log('Upload progress:', progress)
);
```

### 4. Using the React Hook

For React applications, use the `useGreenfield` hook:

```typescript
import { useGreenfield } from '@/hooks/useGreenfield';

const MyComponent = () => {
  const {
    loading,
    error,
    progress,
    uploadProgress,
    createBucket,
    uploadFile,
    downloadFile,
    listBuckets,
    listObjects,
    deleteObject,
    isConnected,
  } = useGreenfield();

  const handleCreateBucket = async () => {
    const result = await createBucket('my-bucket');
    if (result.success) {
      console.log('Bucket created!');
    }
  };

  const handleUploadFile = async () => {
    const result = await uploadFile('my-bucket', 'my-file.txt', fileObject);
    if (result.success) {
      console.log('File uploaded!');
    }
  };

  return (
    <div>
      {error && <div>Error: {error}</div>}
      {progress && <div>Progress: {progress}</div>}
      {uploadProgress && (
        <div>Upload: {uploadProgress.percent.toFixed(1)}%</div>
      )}
      <button onClick={handleCreateBucket} disabled={loading}>
        Create Bucket
      </button>
      <button onClick={handleUploadFile} disabled={loading}>
        Upload File
      </button>
    </div>
  );
};
```

## Key Concepts

### 1. Storage Providers (SPs)

Storage providers are the nodes that actually store your data. The system automatically selects SPs based on availability and performance.

### 2. Off-Chain Authentication

Greenfield uses off-chain authentication to reduce gas costs. Authentication keys are generated and stored locally, with a 5-day expiration.

### 3. Visibility Types

- `VISIBILITY_TYPE_PUBLIC_READ`: Anyone can read the bucket/object
- `VISIBILITY_TYPE_PRIVATE`: Only the owner can access
- `VISIBILITY_TYPE_INHERIT`: Inherits visibility from parent bucket

### 4. Gas Fees

All bucket operations (create, delete) require gas fees paid in BNB. File uploads and downloads use off-chain authentication to avoid gas costs.

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await greenfieldService.createBucket(bucketInfo, address, provider);
  if (result.success) {
    // Handle success
  } else {
    // Handle error
    console.error('Failed to create bucket:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 2. Progress Tracking

Use progress callbacks for better UX:

```typescript
const result = await greenfieldService.uploadFile(
  objectInfo,
  address,
  provider,
  (progress) => {
    setUploadProgress(progress.percent);
  }
);
```

### 3. Authentication Management

The system automatically manages authentication keys, but you can manually clear them if needed:

```typescript
localStorage.removeItem(address); // Clear auth keys for address
```

### 4. Bucket Naming

Bucket names must be globally unique across the entire Greenfield network. Use unique identifiers:

```typescript
const bucketName = `my-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

## Troubleshooting

### Common Issues

1. **"No offchain, please create offchain pairs first"**
   - Clear localStorage and reconnect wallet
   - Ensure wallet is connected to the correct network

2. **"Bucket name already exists"**
   - Bucket names must be globally unique
   - Use unique identifiers in bucket names

3. **"Transaction failed"**
   - Ensure sufficient BNB balance for gas fees
   - Check network connectivity

4. **"Upload failed"**
   - Verify file size is within limits
   - Check storage provider availability

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('greenfield-debug', 'true');
```

## Network Information

### Testnet
- Chain ID: 5600
- GRPC URL: `https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org`
- RPC URL: `https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org`

### Mainnet
- Chain ID: 1017
- GRPC URL: `https://gnfd-mainnet-fullnode-tendermint-us.bnbchain.org`
- RPC URL: `https://gnfd-mainnet-fullnode-tendermint-us.bnbchain.org`

## Additional Resources

- [BNB Greenfield Documentation](https://docs.bnbchain.org/greenfield-docs/)
- [Greenfield JS SDK](https://github.com/bnb-chain/greenfield-js-sdk)
- [Greenfield Testnet Faucet](https://testnet.binance.org/faucet-smart)

## Example Usage

See `src/components/GreenfieldExample/index.tsx` for a complete example of how to use all Greenfield operations in a React component.
