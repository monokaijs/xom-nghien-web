'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/server';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user || null,
          isLoggedIn: data.isLoggedIn || false,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isLoggedIn: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
    }
  };

  const login = () => {
    window.location.href = '/api/auth/steam';
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setAuthState({
          user: null,
          isLoggedIn: false,
          isLoading: false,
        });
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  };
}
