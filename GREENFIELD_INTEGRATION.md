# BNB Greenfield Integration in FairBNB

This document describes the integration of BNB Greenfield for decentralized metadata storage in the FairBNB platform.

## Overview

The AddListing.jsx page now stores all property listing metadata on BNB Greenfield's decentralized storage network. This ensures data permanence, censorship resistance, and true ownership of listing data.

## Architecture

### Core Components

1. **Greenfield Client** (`src/lib/services/greenfieldClient.js`)
   - Initializes BNB Greenfield SDK
   - Manages storage provider selection
   - Handles GRPC connections

2. **Greenfield Service** (`src/lib/services/greenfieldService.js`)
   - High-level service for metadata operations
   - Bucket management
   - Metadata upload/download functionality

3. **Off-chain Authentication** (`src/lib/utils/offchainAuth.js`)
   - Manages authentication keys for Greenfield operations
   - Handles key generation and caching

4. **Wallet Hook** (`src/lib/hooks/useWallet.js`)
   - Provides wallet connection functionality
   - Manages wallet state across components

5. **Status Component** (`src/components/GreenfieldStatus.jsx`)
   - Real-time status monitoring for Greenfield connection
   - User-friendly feedback and error handling

## Configuration

### Environment Variables

```bash
REACT_APP_GRPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
REACT_APP_GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
REACT_APP_GREEN_CHAIN_ID=5600
```

### Network Configuration

- **Chain**: BNB Greenfield Testnet
- **Chain ID**: 5600
- **Bucket Name**: fairbnb-listings
- **Storage Provider**: Auto-selected from available NodeReal providers

## User Flow

### 1. Wallet Connection
- User connects MetaMask or compatible wallet
- System verifies connection to Greenfield network
- Off-chain authentication keys are generated and cached

### 2. Metadata Preparation
- Form data is collected through multi-step wizard
- Metadata is structured as JSON with the following schema:

```json
{
  "id": "listing_timestamp_randomId",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "type": "property_listing",
  "version": "1.0.0",
  "data": {
    "title": "Property Title",
    "propertyType": "Apartment",
    "description": "Property description",
    "location": {
      "address": "Street address",
      "city": "City",
      "state": "State",
      "country": "Country code",
      "pincode": "Postal code"
    },
    "pricing": {
      "rentPerMonth": 25000,
      "securityDeposit": 50000,
      "disputeFee": 1000,
      "currency": "BNB"
    },
    "availability": {
      "availableFrom": "2024-01-01",
      "minDurationMonths": 3,
      "maxDurationMonths": 12
    },
    "photos": ["url1", "url2"],
    "coverImageIndex": 0,
    "amenities": ["Wi-Fi", "AC", "Kitchen"],
    "owner": "0x...",
    "blockchain": {
      "network": "bnb-greenfield",
      "chainId": 5600
    }
  }
}
```

### 3. Greenfield Upload
- Metadata JSON is converted to blob
- Uploaded using delegated upload for gas-free operation
- Object path: `listings/{listingId}/metadata.json`
- Public read visibility for accessibility

### 4. Local Storage
- Greenfield URL and listing ID stored in local database
- Metadata remains accessible via Greenfield even if local data is lost

## Implementation Details

### Bucket Management
- Automatic bucket creation on first use
- Public read visibility for metadata accessibility
- Organized folder structure: `listings/{id}/metadata.json`

### Error Handling
- Graceful fallback for wallet connection issues
- Retry mechanisms for network failures
- User-friendly error messages with actionable steps

### Authentication
- Off-chain keys cached in localStorage for 5 days
- Automatic re-authentication when keys expire
- Domain-scoped authentication for security

### Storage Provider Selection
- Automatic selection from available NodeReal providers
- Load balancing across multiple endpoints
- Fallback mechanisms for provider failures

## Benefits

1. **Decentralization**: Metadata stored on distributed network
2. **Permanence**: Data cannot be deleted or censored
3. **Ownership**: Users maintain control of their listing data
4. **Accessibility**: Public metadata can be accessed from any application
5. **Cost-Effective**: Delegated uploads reduce gas costs
6. **Scalability**: Greenfield provides unlimited storage capacity

## Security Considerations

1. **Data Privacy**: Only metadata is stored publicly
2. **Authentication**: Off-chain keys prevent unauthorized access
3. **Validation**: All data is validated before upload
4. **Encryption**: Sensitive data can be encrypted before storage

## Monitoring and Debugging

### Status Component
The `GreenfieldStatus` component provides real-time monitoring:
- Wallet connection status
- Greenfield service initialization
- Bucket availability
- Error reporting and retry options

### Logging
- Console logging for development debugging
- Error tracking for production monitoring
- Upload progress indicators for user feedback

## Future Enhancements

1. **Image Storage**: Upload property images to Greenfield
2. **Batch Operations**: Bulk metadata updates
3. **Cross-Chain**: Support for multiple blockchain networks
4. **Advanced Encryption**: Private listing data encryption
5. **IPFS Gateway**: Alternative access methods for metadata

## Testing

### Development Testing
1. Connect wallet to Greenfield testnet
2. Create a test listing
3. Verify metadata upload to Greenfield
4. Check object accessibility via public URL

### Production Deployment
1. Update environment variables for mainnet
2. Test bucket creation permissions
3. Verify storage provider availability
4. Monitor upload success rates

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Switch to correct network (Greenfield Testnet)
   - Refresh page and retry connection

2. **Greenfield Upload Failed**
   - Check internet connection
   - Verify wallet has sufficient BNB for gas
   - Retry with different storage provider

3. **Authentication Keys Expired**
   - Clear localStorage cache
   - Reconnect wallet to generate new keys
   - Check system clock accuracy

4. **Bucket Creation Failed**
   - Verify wallet permissions
   - Check Greenfield network status
   - Ensure unique bucket naming

### Support

For technical support or questions about the Greenfield integration:
1. Check console logs for detailed error messages
2. Use the built-in status component for diagnostics
3. Refer to BNB Greenfield documentation
4. Contact the development team with specific error details

## Dependencies

- `@bnb-chain/greenfield-js-sdk`: Official Greenfield SDK
- `ethers`: Ethereum wallet integration
- `react-hook-form`: Form management
- `sonner`: Toast notifications for user feedback

This integration ensures that FairBNB users have full control and permanent access to their listing metadata through BNB Greenfield's decentralized storage network.

