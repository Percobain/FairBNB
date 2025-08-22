/**
 * @fileoverview Global application store using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * @typedef {import('../types.js').User} User
 */

/**
 * Global application store
 */
export const useAppStore = create()(
  devtools(
    (set, get) => ({
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

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }, false, 'setCurrentUser'),
      
      switchRole: (role) => set(
        (state) => ({
          currentUser: { ...state.currentUser, role }
        }),
        false,
        'switchRole'
      ),

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
