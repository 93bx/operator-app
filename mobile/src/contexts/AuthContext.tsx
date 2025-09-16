import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import * as SecureStore from 'expo-secure-store';
import api, { endpoints } from '../config/api';
import dataService from '../services/dataService';
import { User } from '../types';


interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is already logged in
  const { data: userData, isLoading: userLoading } = useQuery(
    'user',
    async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return null;
      
      // Try to get user from local database first
      const localUser = await dataService.getUser();
      if (localUser) {
        return localUser;
      }
      
      // If not in local DB, fetch from server
      const response = await api.get(endpoints.auth.verify);
      const user = response.data.data.user;
      
      // Save to local database
      await dataService.saveUser(user);
      
      return user;
    },
    {
      retry: false,
      onError: () => {
        SecureStore.deleteItemAsync('auth_token');
        setUser(null);
      }
    }
  );

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
    setLoading(userLoading);
  }, [userData, userLoading]);

  const loginMutation = useMutation(
    async ({ email, password }: { email: string; password: string }) => {
      const response = await api.post(endpoints.auth.login, { email, password });
      return response.data;
    },
    {
      onSuccess: async (data) => {
        const { token, user: userData } = data.data;
        await SecureStore.setItemAsync('auth_token', token);
        await dataService.saveUser(userData);
        setUser(userData);
        queryClient.setQueryData('user', userData);
      },
      onError: (error: any) => {
        console.error('Login error:', error);
      }
    }
  );

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await dataService.clearAllData();
    setUser(null);
    queryClient.clear();
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading: loading || loginMutation.isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
