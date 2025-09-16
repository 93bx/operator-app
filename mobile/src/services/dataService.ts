import { executeQuery, executeTransaction } from '../config/database';
import { User, Station, Reading, Fault } from '../types';

export class DataService {
  private static instance: DataService;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    await executeQuery(
      `INSERT OR REPLACE INTO users 
       (id, email, first_name, last_name, role, phone, is_active, last_login, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        user.firstName,
        user.lastName,
        user.role,
        user.phone,
        user.isActive ? 1 : 0,
        user.lastLogin,
        user.createdAt,
        user.updatedAt
      ]
    );
  }

  async getUser(): Promise<User | null> {
    const result = await executeQuery('SELECT * FROM users LIMIT 1');
    if (result.rows.length === 0) return null;
    
    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      isActive: user.is_active === 1,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  // Station operations
  async saveStation(station: Station): Promise<void> {
    await executeQuery(
      `INSERT OR REPLACE INTO stations 
       (id, name, name_ar, location_name, location_name_ar, latitude, longitude, 
        address, address_ar, status, capacity_liters, operator_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        station.id,
        station.name,
        station.nameAr,
        station.locationName,
        station.locationNameAr,
        station.latitude,
        station.longitude,
        station.address,
        station.addressAr,
        station.status,
        station.capacityLiters,
        station.operatorId,
        station.createdAt,
        station.updatedAt
      ]
    );
  }

  async getStations(): Promise<Station[]> {
    const result = await executeQuery('SELECT * FROM stations ORDER BY name');
    return result.rows.map(station => ({
      id: station.id,
      name: station.name,
      nameAr: station.name_ar,
      locationName: station.location_name,
      locationNameAr: station.location_name_ar,
      latitude: station.latitude,
      longitude: station.longitude,
      address: station.address,
      addressAr: station.address_ar,
      status: station.status,
      capacityLiters: station.capacity_liters,
      operatorId: station.operator_id,
      createdAt: station.created_at,
      updatedAt: station.updated_at
    }));
  }

  async getStation(id: string): Promise<Station | null> {
    const result = await executeQuery('SELECT * FROM stations WHERE id = ?', [id]);
    if (result.rows.length === 0) return null;
    
    const station = result.rows[0];
    return {
      id: station.id,
      name: station.name,
      nameAr: station.name_ar,
      locationName: station.location_name,
      locationNameAr: station.location_name_ar,
      latitude: station.latitude,
      longitude: station.longitude,
      address: station.address,
      addressAr: station.address_ar,
      status: station.status,
      capacityLiters: station.capacity_liters,
      operatorId: station.operator_id,
      createdAt: station.created_at,
      updatedAt: station.updated_at
    };
  }

  // Reading operations
  async saveReading(reading: Omit<Reading, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    const id = reading.id || this.generateId();
    const now = new Date().toISOString();
    
    await executeQuery(
      `INSERT OR REPLACE INTO daily_readings 
       (id, station_id, operator_id, reading_date, ph_level, tds_level, temperature, 
        pressure, tank_level_percentage, notes, notes_ar, is_synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        reading.stationId,
        reading.operatorId,
        reading.readingDate,
        reading.phLevel,
        reading.tdsLevel,
        reading.temperature,
        reading.pressure,
        reading.tankLevelPercentage,
        reading.notes,
        reading.notesAr,
        reading.isSynced ? 1 : 0,
        now,
        now
      ]
    );
    
    return id;
  }

  async getReadings(limit: number = 50, offset: number = 0): Promise<Reading[]> {
    const result = await executeQuery(
      `SELECT r.*, s.name as station_name, s.name_ar as station_name_ar,
              u.first_name as operator_first_name, u.last_name as operator_last_name
       FROM daily_readings r
       JOIN stations s ON r.station_id = s.id
       JOIN users u ON r.operator_id = u.id
       ORDER BY r.reading_date DESC, r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return result.rows.map(reading => ({
      id: reading.id,
      stationId: reading.station_id,
      stationName: reading.station_name,
      stationNameAr: reading.station_name_ar,
      operatorId: reading.operator_id,
      operatorName: `${reading.operator_first_name} ${reading.operator_last_name}`,
      readingDate: reading.reading_date,
      phLevel: reading.ph_level,
      tdsLevel: reading.tds_level,
      temperature: reading.temperature,
      pressure: reading.pressure,
      tankLevelPercentage: reading.tank_level_percentage,
      notes: reading.notes,
      notesAr: reading.notes_ar,
      isSynced: reading.is_synced === 1,
      createdAt: reading.created_at,
      updatedAt: reading.updated_at
    }));
  }

  async getReading(id: string): Promise<Reading | null> {
    const result = await executeQuery(
      `SELECT r.*, s.name as station_name, s.name_ar as station_name_ar,
              u.first_name as operator_first_name, u.last_name as operator_last_name
       FROM daily_readings r
       JOIN stations s ON r.station_id = s.id
       JOIN users u ON r.operator_id = u.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const reading = result.rows[0];
    return {
      id: reading.id,
      stationId: reading.station_id,
      stationName: reading.station_name,
      stationNameAr: reading.station_name_ar,
      operatorId: reading.operator_id,
      operatorName: `${reading.operator_first_name} ${reading.operator_last_name}`,
      readingDate: reading.reading_date,
      phLevel: reading.ph_level,
      tdsLevel: reading.tds_level,
      temperature: reading.temperature,
      pressure: reading.pressure,
      tankLevelPercentage: reading.tank_level_percentage,
      notes: reading.notes,
      notesAr: reading.notes_ar,
      isSynced: reading.is_synced === 1,
      createdAt: reading.created_at,
      updatedAt: reading.updated_at
    };
  }

  // Fault operations
  async saveFault(fault: Omit<Fault, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    const id = fault.id || this.generateId();
    const now = new Date().toISOString();
    
    await executeQuery(
      `INSERT OR REPLACE INTO faults 
       (id, station_id, reported_by, assigned_to, title, title_ar, description, description_ar,
        status, priority, latitude, longitude, photo_url, resolved_at, is_synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fault.stationId,
        fault.reportedBy,
        fault.assignedTo,
        fault.title,
        fault.titleAr,
        fault.description,
        fault.descriptionAr,
        fault.status,
        fault.priority,
        fault.latitude,
        fault.longitude,
        fault.photoUrl,
        fault.resolvedAt,
        fault.isSynced ? 1 : 0,
        now,
        now
      ]
    );
    
    return id;
  }

  async getFaults(limit: number = 50, offset: number = 0): Promise<Fault[]> {
    const result = await executeQuery(
      `SELECT f.*, s.name as station_name, s.name_ar as station_name_ar,
              reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name,
              assignee.first_name as assignee_first_name, assignee.last_name as assignee_last_name
       FROM faults f
       JOIN stations s ON f.station_id = s.id
       JOIN users reporter ON f.reported_by = reporter.id
       LEFT JOIN users assignee ON f.assigned_to = assignee.id
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return result.rows.map(fault => ({
      id: fault.id,
      stationId: fault.station_id,
      stationName: fault.station_name,
      stationNameAr: fault.station_name_ar,
      reportedBy: fault.reported_by,
      reporterName: `${fault.reporter_first_name} ${fault.reporter_last_name}`,
      assignedTo: fault.assigned_to,
      assigneeName: fault.assignee_first_name && fault.assignee_last_name 
        ? `${fault.assignee_first_name} ${fault.assignee_last_name}` 
        : null,
      title: fault.title,
      titleAr: fault.title_ar,
      description: fault.description,
      descriptionAr: fault.description_ar,
      status: fault.status,
      priority: fault.priority,
      latitude: fault.latitude,
      longitude: fault.longitude,
      photoUrl: fault.photo_url,
      resolvedAt: fault.resolved_at,
      isSynced: fault.is_synced === 1,
      createdAt: fault.created_at,
      updatedAt: fault.updated_at
    }));
  }

  async getFault(id: string): Promise<Fault | null> {
    const result = await executeQuery(
      `SELECT f.*, s.name as station_name, s.name_ar as station_name_ar,
              reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name,
              assignee.first_name as assignee_first_name, assignee.last_name as assignee_last_name
       FROM faults f
       JOIN stations s ON f.station_id = s.id
       JOIN users reporter ON f.reported_by = reporter.id
       LEFT JOIN users assignee ON f.assigned_to = assignee.id
       WHERE f.id = ?`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const fault = result.rows[0];
    return {
      id: fault.id,
      stationId: fault.station_id,
      stationName: fault.station_name,
      stationNameAr: fault.station_name_ar,
      reportedBy: fault.reported_by,
      reporterName: `${fault.reporter_first_name} ${fault.reporter_last_name}`,
      assignedTo: fault.assigned_to,
      assigneeName: fault.assignee_first_name && fault.assignee_last_name 
        ? `${fault.assignee_first_name} ${fault.assignee_last_name}` 
        : null,
      title: fault.title,
      titleAr: fault.title_ar,
      description: fault.description,
      descriptionAr: fault.description_ar,
      status: fault.status,
      priority: fault.priority,
      latitude: fault.latitude,
      longitude: fault.longitude,
      photoUrl: fault.photo_url,
      resolvedAt: fault.resolved_at,
      isSynced: fault.is_synced === 1,
      createdAt: fault.created_at,
      updatedAt: fault.updated_at
    };
  }

  // Utility methods
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async clearAllData(): Promise<void> {
    await executeTransaction([
      { sql: 'DELETE FROM daily_readings' },
      { sql: 'DELETE FROM faults' },
      { sql: 'DELETE FROM stations' },
      { sql: 'DELETE FROM users' }
    ]);
  }
}

export default DataService.getInstance();
