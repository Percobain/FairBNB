import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { VisibilityType } from '@bnb-chain/greenfield-js-sdk';
import { greenfieldService, BucketInfo, ObjectInfo, UploadProgress } from '@/utils/greenfieldService';

export interface GreenfieldState {
  loading: boolean;
  error: string | null;
  progress: string | null;
  uploadProgress: UploadProgress | null;
}

export const useGreenfield = () => {
  const { address, connector } = useAccount();
  const [state, setState] = useState<GreenfieldState>({
    loading: false,
    error: null,
    progress: null,
    uploadProgress: null,
  });

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      progress: null,
      uploadProgress: null,
    });
  }, []);

  const createBucket = useCallback(async (
    bucketName: string,
    visibility: VisibilityType = VisibilityType.VISIBILITY_TYPE_PUBLIC_READ
  ) => {
    if (!address || !connector) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    resetState();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const provider = await connector.getProvider();
      const bucketInfo: BucketInfo = {
        bucketName,
        creator: address,
        visibility,
      };

      const result = await greenfieldService.createBucket(
        bucketInfo,
        address,
        provider,
        (progress) => setState(prev => ({ ...prev, progress }))
      );

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null,
        progress: null 
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
        progress: null 
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, connector, resetState]);

  const uploadFile = useCallback(async (
    bucketName: string,
    objectName: string,
    file: File,
    visibility?: VisibilityType
  ) => {
    if (!address || !connector) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    resetState();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const provider = await connector.getProvider();
      const objectInfo: ObjectInfo = {
        bucketName,
        objectName,
        file,
        visibility,
      };

      const result = await greenfieldService.uploadFile(
        objectInfo,
        address,
        provider,
        (progress) => setState(prev => ({ ...prev, uploadProgress: progress }))
      );

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null,
        uploadProgress: null 
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
        uploadProgress: null 
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, connector, resetState]);

  const downloadFile = useCallback(async (
    bucketName: string,
    objectName: string
  ) => {
    if (!address || !connector) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    resetState();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const provider = await connector.getProvider();
      const result = await greenfieldService.downloadFile(
        bucketName,
        objectName,
        address,
        provider
      );

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null 
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, connector, resetState]);

  const listBuckets = useCallback(async () => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    resetState();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await greenfieldService.listBuckets(address);

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null 
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, resetState]);

  const listObjects = useCallback(async (bucketName: string) => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    resetState();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await greenfieldService.listObjects(bucketName, address);

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null 
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, resetState]);

  const deleteObject = useCallback(async (
    bucketName: string,
    objectName: string
  ) => {
    if (!address || !connector) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    resetState();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const provider = await connector.getProvider();
      const result = await greenfieldService.deleteObject(
        bucketName,
        objectName,
        address,
        provider
      );

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null 
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, connector, resetState]);

  return {
    // State
    ...state,
    
    // Actions
    createBucket,
    uploadFile,
    downloadFile,
    listBuckets,
    listObjects,
    deleteObject,
    resetState,
    
    // Utilities
    isConnected: !!address,
  };
};
