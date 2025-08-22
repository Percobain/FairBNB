/**
 * @fileoverview Component to display Greenfield connection status
 */

import { useState, useEffect } from 'react';
import { NBCard } from './NBCard';
import { NBButton } from './NBButton';
import { greenfieldService } from '@/lib/services/greenfieldService';
import { useWallet } from '@/lib/hooks/useWallet';
import { Database, Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';

export function GreenfieldStatus() {
  const [status, setStatus] = useState({
    isInitialized: false,
    bucketExists: false,
    loading: true,
    error: null
  });

  const { address, provider, isConnected } = useWallet();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isConnected || !address || !provider) {
        setStatus({
          isInitialized: false,
          bucketExists: false,
          loading: false,
          error: 'Wallet not connected'
        });
        return;
      }

      try {
        setStatus(prev => ({ ...prev, loading: true, error: null }));

        // Initialize Greenfield service
        await greenfieldService.initialize(address, provider);
        
        setStatus({
          isInitialized: true,
          bucketExists: greenfieldService.bucketCreated,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Greenfield status check failed:', error);
        setStatus({
          isInitialized: false,
          bucketExists: false,
          loading: false,
          error: error.message
        });
      }
    };

    checkStatus();
  }, [isConnected, address, provider]);

  const retryConnection = async () => {
    if (isConnected && address && provider) {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      try {
        await greenfieldService.initialize(address, provider);
        setStatus({
          isInitialized: true,
          bucketExists: greenfieldService.bucketCreated,
          loading: false,
          error: null
        });
      } catch (error) {
        setStatus(prev => ({ ...prev, loading: false, error: error.message }));
      }
    }
  };

  return (
    <NBCard className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Database className="w-5 h-5 text-nb-ink mr-2" />
          <h3 className="font-medium text-nb-ink">BNB Greenfield Status</h3>
        </div>
        
        {status.loading ? (
          <div className="flex items-center text-yellow-600">
            <Wifi className="w-4 h-4 mr-1 animate-pulse" />
            <span className="text-sm">Checking...</span>
          </div>
        ) : status.isInitialized ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Connected</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <XCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Disconnected</span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-nb-ink/70">Wallet Connected:</span>
          <span className={isConnected ? "text-green-600" : "text-red-600"}>
            {isConnected ? "✓" : "✗"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-nb-ink/70">Service Initialized:</span>
          <span className={status.isInitialized ? "text-green-600" : "text-red-600"}>
            {status.isInitialized ? "✓" : "✗"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-nb-ink/70">Bucket Ready:</span>
          <span className={status.bucketExists ? "text-green-600" : "text-yellow-600"}>
            {status.bucketExists ? "✓" : "⟳"}
          </span>
        </div>

        {address && (
          <div className="pt-2 border-t border-nb-ink/20">
            <span className="text-nb-ink/70">Address:</span>
            <p className="text-xs font-mono break-all text-nb-ink">
              {address}
            </p>
          </div>
        )}
      </div>

      {status.error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-nb">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {status.error}
          </p>
          <NBButton
            type="button"
            variant="ghost"
            onClick={retryConnection}
            disabled={status.loading}
            className="mt-2 text-xs"
          >
            Retry
          </NBButton>
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-nb">
          <p className="text-sm text-yellow-700">
            Please connect your wallet to use BNB Greenfield storage.
          </p>
        </div>
      )}
    </NBCard>
  );
}

