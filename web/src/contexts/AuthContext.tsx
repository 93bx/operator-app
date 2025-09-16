import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { message } from 'antd';
import api from '../services/api';
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
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      const response = await api.get('/auth/verify');
      return response.data.data.user;
    },
    {
      retry: false,
      onError: () => {
        localStorage.removeItem('auth_token');
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
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    },
    {
      onSuccess: (data) => {
        const { token, user: userData } = data.data;
        localStorage.setItem('auth_token', token);
        setUser(userData);
        queryClient.setQueryData('user', userData);
        message.success('Login successful');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Login failed';
        message.error(errorMessage);
      }
    }
  );

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    queryClient.clear();
    message.success('Logged out successfully');
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
