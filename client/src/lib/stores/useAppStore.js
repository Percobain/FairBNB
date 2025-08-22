/**
 * @fileoverview Global application store using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { web3Service } from '../services/web3Service.js';

/**
 * @typedef {import('../types.js').User} User
 */

/**
 * Global application store
 */
export const useAppStore = create()(
  devtools(
    (set, get) => ({
      // Web3 state
      web3: {
        isConnected: false,
        account: null,
        chainId: null,
        isInitializing: false,
        error: null
      },

      // Current user (mock)
      currentUser: {
        id: 'user_001',
        role: 'landlord', // Can be switched for demo
        name: 'Demo User',
        avatarUrl: '/mock-images/avatar-1.jpg'
      },

      // UI state
      sidebarOpen: false,
      loading: false,
      notifications: [],

      // Web3 Actions
      initializeWeb3: async () => {
        set({ 
          web3: { ...get().web3, isInitializing: true, error: null } 
        }, false, 'initializeWeb3');

        try {
          const result = await web3Service.initialize();
          
          if (result.success) {
            set({
              web3: {
                isConnected: true,
                account: result.account,
                chainId: result.chainId,
                isInitializing: false,
                error: null
              }
            }, false, 'web3Connected');
          } else {
            set({
              web3: {
                isConnected: false,
                account: null,
                chainId: null,
                isInitializing: false,
                error: result.error
              }
            }, false, 'web3Error');
          }
        } catch (error) {
          set({
            web3: {
              isConnected: false,
              account: null,
              chainId: null,
              isInitializing: false,
              error: error.message
            }
          }, false, 'web3Error');
        }
      },

      disconnectWeb3: () => {
        web3Service.disconnect();
        set({
          web3: {
            isConnected: false,
            account: null,
            chainId: null,
            isInitializing: false,
            error: null
          }
        }, false, 'web3Disconnected');
      },

      // User Actions
      setCurrentUser: (user) => set({ currentUser: user }, false, 'setCurrentUser'),
      
      switchRole: (role) => set(
        (state) => ({
          currentUser: { ...state.currentUser, role }
        }),
        false,
        'switchRole'
      ),

      // UI Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),
      
      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      addNotification: (notification) => set(
        (state) => ({
          notifications: [
            ...state.notifications,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              ...notification
            }
          ]
        }),
        false,
        'addNotification'
      ),

      removeNotification: (id) => set(
        (state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }),
        false,
        'removeNotification'
      ),

      clearNotifications: () => set({ notifications: [] }, false, 'clearNotifications')
    }),
    {
      name: 'fairbnb-app-store'
    }
  )
);
