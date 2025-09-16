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
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
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

export interface SyncResult {
  success: boolean;
  readings: {
    synced: number;
    errors: number;
  };
  faults: {
    synced: number;
    errors: number;
  };
  errors: string[];
}

export interface SyncStatus {
  isOnline: boolean;
  unsyncedReadings: number;
  unsyncedFaults: number;
  lastSync?: string;
}
