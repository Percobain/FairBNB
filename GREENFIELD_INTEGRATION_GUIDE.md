# Greenfield Integration with Existing Bucket - JavaScript Guide

This guide explains how to integrate BNB Greenfield storage with an existing bucket using JavaScript for your FairBNB project.

## 🎯 **Key Concept: Using an Existing Bucket**

Instead of creating new buckets for each property, we use **one shared bucket** for all property images. This approach:

- ✅ **Simplifies management** - Only one bucket to maintain
- ✅ **Reduces costs** - No gas fees for bucket creation
- ✅ **Better organization** - All images in one place
- ✅ **Easier access** - Single bucket for all property images

## 📁 **File Structure**

```
FairBNB/client/src/
├── lib/services/
│   └── greenfieldService.js     # Core Greenfield operations
├── hooks/
│   └── useGreenfield.js         # React hook for Greenfield
└── components/
    └── GreenfieldImageUpload.jsx # Image upload component
```

## 🔧 **Setup Instructions**

### 1. **Install Dependencies**

```bash
npm install @bnb-chain/greenfield-js-sdk
```

### 2. **Environment Variables**

Create a `.env` file in your client directory:

```env
VITE_GRPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
VITE_GREEN_CHAIN_ID=5600
VITE_GREENFIELD_BUCKET_NAME=fairbnb-properties
```

### 3. **Bucket Configuration**

The system uses a single bucket named `fairbnb-properties` (or whatever you set in `VITE_GREENFIELD_BUCKET_NAME`).

## 🚀 **How It Works**

### **1. File Naming Convention**

Files are automatically named using this pattern:
```
property-{propertyId}-{timestamp}-{randomId}.{extension}
```

Example: `property-123-1703123456789-abc123def.jpg`

### **2. Public URLs**

After upload, files are accessible via:
```
https://gnfd-testnet-sp1.bnbchain.org/view/{bucketName}/{objectName}
```

### **3. Authentication Flow**

1. **Off-chain Auth**: Generates authentication keys (5-day expiration)
2. **Local Storage**: Keys are cached in localStorage
3. **Auto-renewal**: Keys are automatically regenerated when expired

## 💻 **Usage Examples**

### **Basic Upload**

```javascript
import { useGreenfield } from '@/hooks/useGreenfield';

function MyComponent() {
  const { uploadFile, loading, error } = useGreenfield();
  
  const handleUpload = async (file) => {
    const result = await uploadFile(file, 'property-123', address, provider);
    
    if (result.success) {
      console.log('Image URL:', result.imageUrl);
      // result.imageUrl = https://gnfd-testnet-sp1.bnbchain.org/view/fairbnb-properties/property-123-...
    }
  };
}
```

### **Integration with AddListing**

```javascript
import { GreenfieldImageUpload } from '@/components/GreenfieldImageUpload';

function AddListing() {
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const handleImagesUploaded = (images) => {
    setUploadedImages(images);
    // images = ['https://gnfd-testnet-sp1.bnbchain.org/view/fairbnb-properties/...', ...]
  };
  
  return (
    <GreenfieldImageUpload
      onImagesUploaded={handleImagesUploaded}
      propertyId="property-123"
      address={walletAddress}
      provider={walletProvider}
      maxImages={10}
    />
  );
}
```

### **Direct Service Usage**

```javascript
import { uploadFileToBucket, generateObjectName } from '@/lib/services/greenfieldService';

// Upload a single file
const uploadImage = async (file, propertyId, address, provider) => {
  const objectName = generateObjectName(propertyId, file.name);
  
  const result = await uploadFileToBucket(
    file, 
    objectName, 
    address, 
    provider,
    (progress) => {
      console.log(`Upload: ${progress.percent}%`);
    }
  );
  
  if (result.success) {
    return result.imageUrl;
  }
};
```

## 🔄 **Integration Steps**

### **Step 1: Update AddListing.jsx**

Replace the existing photo upload section in your `AddListing.jsx`:

```javascript
// Replace this section in AddListing.jsx (around line 300)
{currentStep === 2 && (
  <div className="space-y-6">
    <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
      Property Photos
    </h2>
    
    <GreenfieldImageUpload
      onImagesUploaded={(images) => setPhotos(images)}
      propertyId={watch('title')?.replace(/\s+/g, '-').toLowerCase() || 'property'}
      address={address} // Your wallet address
      provider={provider} // Your wallet provider
      maxImages={10}
    />
  </div>
)}
```

### **Step 2: Add Wallet Integration**

Make sure you have wallet connection in your AddListing component:

```javascript
import { useAccount } from 'wagmi'; // or your wallet library

function AddListing() {
  const { address, connector } = useAccount();
  const [provider, setProvider] = useState(null);
  
  useEffect(() => {
    if (connector) {
      connector.getProvider().then(setProvider);
    }
  }, [connector]);
  
  // ... rest of your component
}
```

### **Step 3: Update Form Submission**

Modify your form submission to use the uploaded images:

```javascript
const onSubmit = (data) => {
  try {
    const newListing = create({
      ...data,
      photos: photos.length > 0 ? photos : ['/mock-images/property-1.jpg'],
      coverImage: 0,
      amenities: ['Wi-Fi', 'AC', 'Kitchen']
    });

    toast.success('Listing created successfully!');
    navigate('/landlord');
  } catch (error) {
    console.error('Failed to create listing:', error);
    toast.error('Failed to create listing. Please try again.');
  }
};
```

## 🎨 **Component Features**

The `GreenfieldImageUpload` component includes:

- ✅ **Drag & Drop** - Easy file selection
- ✅ **Multiple Files** - Upload up to 10 images
- ✅ **Progress Tracking** - Real-time upload progress
- ✅ **File Validation** - Image type and size checks
- ✅ **Preview** - See images before upload
- ✅ **Error Handling** - Clear error messages
- ✅ **Responsive Design** - Works on all devices

## 🔧 **Configuration Options**

### **Environment Variables**

```env
# Required
VITE_GRPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
VITE_GREEN_CHAIN_ID=5600
VITE_GREENFIELD_BUCKET_NAME=fairbnb-properties

# Optional (for mainnet)
# VITE_GRPC_URL=https://gnfd-mainnet-fullnode-tendermint-us.bnbchain.org
# VITE_GREEN_CHAIN_ID=1017
```

### **Component Props**

```javascript
<GreenfieldImageUpload
  onImagesUploaded={(images) => console.log(images)}
  propertyId="unique-property-id"
  address="0x..." // Wallet address
  provider={provider} // Wallet provider
  maxImages={10} // Maximum images allowed
  maxFileSize={10 * 1024 * 1024} // 10MB max file size
/>
```

## 🚨 **Error Handling**

### **Common Errors**

1. **"Wallet not connected"**
   - Ensure wallet is connected
   - Check if `address` and `provider` are available

2. **"Auth key expired"**
   - System automatically regenerates keys
   - Clear localStorage if issues persist

3. **"Upload failed"**
   - Check file size (max 10MB)
   - Verify file type (images only)
   - Ensure sufficient BNB for gas fees

### **Debug Mode**

Enable debug logging:

```javascript
localStorage.setItem('greenfield-debug', 'true');
```

## 📊 **Performance Tips**

1. **Batch Uploads** - Upload multiple files sequentially
2. **Progress Feedback** - Show upload progress to users
3. **Error Recovery** - Retry failed uploads automatically
4. **File Optimization** - Compress images before upload

## 🔒 **Security Considerations**

1. **Public Access** - All images are publicly readable
2. **Unique Names** - Files have unique names to prevent conflicts
3. **Authentication** - Uses off-chain auth for cost efficiency
4. **Validation** - File type and size validation

## 🧪 **Testing**

### **Test Upload**

```javascript
// Test with a sample image
const testUpload = async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const result = await uploadFile(file, 'test-property', address, provider);
  console.log('Upload result:', result);
};
```

### **Test Bucket Access**

```javascript
import { checkBucketExists } from '@/lib/services/greenfieldService';

const testBucket = async () => {
  const result = await checkBucketExists(address);
  console.log('Bucket exists:', result.exists);
};
```

## 📚 **API Reference**

### **Service Functions**

```javascript
// Upload file
uploadFileToBucket(file, objectName, address, provider, onProgress)

// Download file
downloadFileFromBucket(objectName, address, provider)

// List objects
listBucketObjects(address)

// Delete object
deleteObjectFromBucket(objectName, address, provider)

// Generate object name
generateObjectName(propertyId, fileName)

// Get object URL
getObjectUrl(objectName)

// Check bucket exists
checkBucketExists(address)
```

### **Hook Functions**

```javascript
const {
  loading,           // Boolean
  error,            // String | null
  uploadProgress,   // Object | null
  uploadFile,       // Function
  downloadFile,     // Function
  listObjects,      // Function
  deleteObject,     // Function
  checkBucket,      // Function
  resetState,       // Function
  generateObjectName, // Function
  getObjectUrl      // Function
} = useGreenfield();
```

## 🎯 **Next Steps**

1. **Install dependencies** and set up environment variables
2. **Integrate the component** into your AddListing form
3. **Test uploads** with sample images
4. **Customize styling** to match your design
5. **Add error handling** for production use

This integration provides a complete, production-ready solution for uploading property images to BNB Greenfield using a single shared bucket!
