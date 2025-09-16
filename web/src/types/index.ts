export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'operator';
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  nameAr: string;
  locationName: string;
  locationNameAr: string;
  latitude: number;
  longitude: number;
  address?: string;
  addressAr?: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacityLiters?: number;
  operatorId?: string;
  operatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reading {
  id: string;
  stationId: string;
  stationName: string;
  stationNameAr: string;
  operatorId: string;
  operatorName: string;
  readingDate: string;
  phLevel?: number;
  tdsLevel?: number;
  temperature?: number;
  pressure?: number;
  tankLevelPercentage?: number;
  notes?: string;
  notesAr?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Fault {
  id: string;
  stationId: string;
  stationName: string;
  stationNameAr: string;
  reportedBy: string;
  reporterName: string;
  assignedTo?: string;
  assigneeName?: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateReadingRequest {
  stationId: string;
  readingDate: string;
  phLevel?: number;
  tdsLevel?: number;
  temperature?: number;
  pressure?: number;
  tankLevelPercentage?: number;
  notes?: string;
  notesAr?: string;
}

export interface CreateFaultRequest {
  stationId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}

export interface UpdateFaultRequest {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  status?: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}

export interface SyncData {
  readings: CreateReadingRequest[];
  faults: CreateFaultRequest[];
}

export interface SyncResponse {
  readings: {
    created: number;
    updated: number;
    errors: Array<{
      id: string;
      error: string;
    }>;
  };
  faults: {
    created: number;
    updated: number;
    errors: Array<{
      id: string;
      error: string;
    }>;
  };
}
