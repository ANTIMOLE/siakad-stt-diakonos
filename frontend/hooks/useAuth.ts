/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

export function useAuth(requiredRole?: string) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const cachedUserStr = localStorage.getItem('user');
        const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;

        const response = await authAPI.getCurrentUser();
        if (!response.success || !response.data) {
          throw new Error('Invalid session');
        }

        const backendUser = response.data;

        if (requiredRole && backendUser.role !== requiredRole) {
          toast.error('Akses ditolak');
          router.push('/login');
          return;
        }

        localStorage.setItem('user', JSON.stringify(backendUser));
        setUser(backendUser);
        setIsAuthenticated(true);
      } catch (error) {
        if (localStorage.getItem('user')) {
          toast.warning('Offline mode: Menggunakan data cached');
          setUser(JSON.parse(localStorage.getItem('user')!));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [router, requiredRole]);

  const logout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('user');
      toast.success('Logout berhasil');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout');
    }
  };

  const refresh = async () => {
    try {
      await authAPI.refreshToken();
      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      logout();
    }
  };

  return { user, isLoading, isAuthenticated, logout, refresh };
}