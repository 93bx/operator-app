import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://web-production-8a94d.up.railway.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear stored token
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    }
    return Promise.reject(error);
  }
);

// Network status check
export const isOnline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? false;
};

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    verify: '/auth/verify',
  },
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    changePassword: '/users/change-password',
    list: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  stations: {
    list: '/stations',
    get: (id: string) => `/stations/${id}`,
    create: '/stations',
    update: (id: string) => `/stations/${id}`,
    delete: (id: string) => `/stations/${id}`,
  },
  readings: {
    list: '/daily_readings',
    get: (id: string) => `/daily_readings/${id}`,
    create: '/daily_readings',
    update: (id: string) => `/daily_readings/${id}`,
    delete: (id: string) => `/daily_readings/${id}`,
  },
  faults: {
    list: '/faults',
    get: (id: string) => `/faults/${id}`,
    create: '/faults',
    update: (id: string) => `/faults/${id}`,
    delete: (id: string) => `/faults/${id}`,
  },
  sync: {
    pending: '/sync/pending',
    upload: '/sync/upload',
    markSynced: '/sync/mark-synced',
  },
  upload: {
    single: '/upload/single',
    multiple: '/upload/multiple',
    delete: (filename: string) => `/upload/${filename}`,
    info: (filename: string) => `/upload/${filename}`,
  },
};

export default api;
