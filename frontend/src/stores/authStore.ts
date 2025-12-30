import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { api } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  expiresAt: number | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, expiresAt: number) => void
  logout: () => void
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      setAuth: (user: User, token: string, expiresAt: number) => {
        api.setToken(token)
        set({ user, token, expiresAt, isAuthenticated: true })
      },
      logout: () => {
        api.setToken(null)
        set({ user: null, token: null, expiresAt: null, isAuthenticated: false })
      },
      isTokenExpired: () => {
        const { expiresAt } = get()
        if (!expiresAt) return true
        // Consider token expired 5 minutes before actual expiration
        return Date.now() > expiresAt - 5 * 60 * 1000
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Set token in API client when store is rehydrated
        if (state?.token) {
          api.setToken(state.token)
        }
      },
    }
  )
)
