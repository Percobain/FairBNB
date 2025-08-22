/**
 * @fileoverview Custom hook for wallet integration
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [wallet, setWallet] = useState({
    address: null,
    provider: null,
    isConnected: false,
    isConnecting: false
  });

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask.');
    }

    setWallet(prev => ({ ...prev, isConnecting: true }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const address = accounts[0];

      setWallet({
        address,
        provider: window.ethereum, // Use raw provider for Greenfield
        isConnected: true,
        isConnecting: false
      });

      return { address, provider: window.ethereum };
    } catch (error) {
      setWallet(prev => ({ ...prev, isConnecting: false }));
      throw error;
    }
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      provider: null,
      isConnected: false,
      isConnecting: false
    });
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });

          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setWallet({
              address: accounts[0],
              provider: window.ethereum,
              isConnected: true,
              isConnecting: false
            });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWallet(prev => ({ ...prev, address: accounts[0] }));
        }
      });

      window.ethereum.on('chainChanged', () => {
        // Reload the page when chain changes
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet
  };
};

