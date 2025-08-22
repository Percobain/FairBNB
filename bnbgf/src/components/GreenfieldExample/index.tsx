import React, { useState, useEffect } from 'react';
import { VisibilityType } from '@bnb-chain/greenfield-js-sdk';
import { useGreenfield } from '@/hooks/useGreenfield';
import { greenfieldService } from '@/utils/greenfieldService';

interface Bucket {
  BucketInfo: {
    BucketName: string;
    Owner: string;
    Id: string;
    CreateAt: string;
    Visibility: number;
  };
}

interface Object {
  ObjectInfo: {
    ObjectName: string;
    BucketName: string;
    Id: string;
    CreateAt: string;
    ObjectStatus: number;
    PayloadSize: string;
  };
}

export const GreenfieldExample: React.FC = () => {
  const {
    loading,
    error,
    uploadProgress,
    uploadFile,
    downloadFile,
    listBuckets,
    listObjects,
    deleteObject,
    isConnected,
  } = useGreenfield();

  const [objectName, setObjectName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [visibility] = useState<VisibilityType>(VisibilityType.VISIBILITY_TYPE_PUBLIC_READ);

  // Get the hardcoded bucket
  const hardcodedBucket = greenfieldService.getHardcodedBucket();
  const selectedBucket = hardcodedBucket.BucketInfo.BucketName;

  // Load buckets and objects on component mount
  useEffect(() => {
    if (isConnected) {
      loadBuckets();
      loadObjects(selectedBucket);
    }
  }, [isConnected, selectedBucket]);

  const loadBuckets = async () => {
    const result = await listBuckets();
    if (result.success && result.buckets) {
      setBuckets(result.buckets);
    }
  };

  const loadObjects = async (bucketName: string) => {
    const result = await listObjects(bucketName);
    if (result.success && result.objects) {
      setObjects(result.objects);
    }
  };

  const handleUploadFile = async () => {
    if (!objectName.trim()) {
      alert('Please enter an object name');
      return;
    }
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const result = await uploadFile(selectedBucket, objectName, selectedFile, visibility);
    if (result.success) {
      alert('File uploaded successfully!');
      setObjectName('');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      loadObjects(selectedBucket);
    } else {
      alert(`Failed to upload file: ${result.error}`);
    }
  };

  const handleDownloadFile = async (objectName: string) => {
    const result = await downloadFile(selectedBucket, objectName);
    if (result.success && result.data) {
      // Create download link
      const url = URL.createObjectURL(result.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = objectName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(`Failed to download file: ${result.error}`);
    }
  };

  const handleDeleteObject = async (objectName: string) => {
    if (confirm(`Are you sure you want to delete ${objectName}?`)) {
      const result = await deleteObject(selectedBucket, objectName);
      if (result.success) {
        alert('Object deleted successfully!');
        loadObjects(selectedBucket);
      } else {
        alert(`Failed to delete object: ${result.error}`);
      }
    }
  };

  const formatFileSize = (bytes: string | number) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please connect your wallet to use Greenfield storage.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Greenfield Storage Manager</h1>
      
      {/* Bucket Info Display */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
        <h2 className="font-semibold">Using Hardcoded Bucket: {selectedBucket}</h2>
        <div className="text-sm mt-2">
          <p><strong>Bucket ID:</strong> {hardcodedBucket.BucketInfo.Id}</p>
          <p><strong>Owner:</strong> {hardcodedBucket.BucketInfo.Owner}</p>
          <p><strong>Created:</strong> {formatDate(hardcodedBucket.BucketInfo.CreateAt)}</p>
          <p><strong>Visibility:</strong> {hardcodedBucket.BucketInfo.Visibility === 2 ? 'Public Read' : 'Private'}</p>
          <p className="text-xs mt-1">
            <a href={`https://testnet.dcellar.io/buckets/${selectedBucket}`} target="_blank" rel="noopener noreferrer" className="underline">
              View on DCellar →
            </a>
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center justify-between">
            <span>Upload Progress: {uploadProgress.percent.toFixed(1)}%</span>
            <span>{formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress.percent}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload Operations */}
        <div className="space-y-6">
          {/* Upload File */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload File to {selectedBucket}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Object Name
                </label>
                <input
                  type="text"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter object name (e.g., my-image.jpg)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <button
                onClick={handleUploadFile}
                disabled={loading || !objectName.trim() || !selectedFile}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Objects List */}
        <div className="space-y-6">
          {/* Objects List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Objects in {selectedBucket}</h2>
              <button
                onClick={() => loadObjects(selectedBucket)}
                disabled={loading}
                className="bg-gray-600 text-white py-1 px-3 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {objects.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No objects found in this bucket</p>
              ) : (
                objects.map((object) => (
                  <div key={object.ObjectInfo.Id} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{object.ObjectInfo.ObjectName}</div>
                        <div className="text-sm text-gray-500">
                          Size: {formatFileSize(object.ObjectInfo.PayloadSize)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(object.ObjectInfo.CreateAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Status: {object.ObjectInfo.ObjectStatus === 1 ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleDownloadFile(object.ObjectInfo.ObjectName)}
                          disabled={loading}
                          className="bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteObject(object.ObjectInfo.ObjectName)}
                          disabled={loading}
                          className="bg-red-600 text-white py-1 px-2 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
