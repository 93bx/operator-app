import api, { endpoints } from '../config/api';
import { executeQuery, executeTransaction } from '../config/database';
import { isOnline } from '../config/api';

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

export class SyncService {
  private static instance: SyncService;
  private isSyncing = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      readings: { synced: 0, errors: 0 },
      faults: { synced: 0, errors: 0 },
      errors: []
    };

    try {
      // Check if online
      const online = await isOnline();
      if (!online) {
        throw new Error('No internet connection');
      }

      // Sync readings
      await this.syncReadings(result);
      
      // Sync faults
      await this.syncFaults(result);

      // Download pending data from server
      await this.downloadPendingData(result);

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncReadings(result: SyncResult): Promise<void> {
    try {
      // Get unsynced readings from local database
      const unsyncedReadings = await executeQuery(
        'SELECT * FROM daily_readings WHERE is_synced = 0'
      );

      if (unsyncedReadings.rows.length === 0) {
        return;
      }

      // Prepare data for sync
      const readingsData = unsyncedReadings.rows.map(reading => ({
        stationId: reading.station_id,
        readingDate: reading.reading_date,
        phLevel: reading.ph_level,
        tdsLevel: reading.tds_level,
        temperature: reading.temperature,
        pressure: reading.pressure,
        tankLevelPercentage: reading.tank_level_percentage,
        notes: reading.notes,
        notesAr: reading.notes_ar,
        isSynced: false
      }));

      // Upload to server
      const response = await api.post(endpoints.sync.upload, {
        readings: readingsData
      });

      if (response.data.success) {
        // Mark readings as synced
        const readingIds = unsyncedReadings.rows.map(r => r.id);
        await executeQuery(
          'UPDATE daily_readings SET is_synced = 1 WHERE id IN (' + 
          readingIds.map(() => '?').join(',') + ')',
          readingIds
        );

        result.readings.synced = readingIds.length;
      } else {
        result.readings.errors = readingsData.length;
        result.errors.push('Failed to sync readings');
      }
    } catch (error) {
      result.readings.errors++;
      result.errors.push(`Reading sync error: ${error.message}`);
    }
  }

  private async syncFaults(result: SyncResult): Promise<void> {
    try {
      // Get unsynced faults from local database
      const unsyncedFaults = await executeQuery(
        'SELECT * FROM faults WHERE is_synced = 0'
      );

      if (unsyncedFaults.rows.length === 0) {
        return;
      }

      // Prepare data for sync
      const faultsData = unsyncedFaults.rows.map(fault => ({
        stationId: fault.station_id,
        title: fault.title,
        titleAr: fault.title_ar,
        description: fault.description,
        descriptionAr: fault.description_ar,
        priority: fault.priority,
        latitude: fault.latitude,
        longitude: fault.longitude,
        photoUrl: fault.photo_url,
        isSynced: false
      }));

      // Upload to server
      const response = await api.post(endpoints.sync.upload, {
        faults: faultsData
      });

      if (response.data.success) {
        // Mark faults as synced
        const faultIds = unsyncedFaults.rows.map(f => f.id);
        await executeQuery(
          'UPDATE faults SET is_synced = 1 WHERE id IN (' + 
          faultIds.map(() => '?').join(',') + ')',
          faultIds
        );

        result.faults.synced = faultIds.length;
      } else {
        result.faults.errors = faultsData.length;
        result.errors.push('Failed to sync faults');
      }
    } catch (error) {
      result.faults.errors++;
      result.errors.push(`Fault sync error: ${error.message}`);
    }
  }

  private async downloadPendingData(result: SyncResult): Promise<void> {
    try {
      // Get pending data from server
      const response = await api.get(endpoints.sync.pending);
      
      if (response.data.success) {
        const { readings, faults } = response.data.data;

        // Store readings locally
        if (readings && readings.length > 0) {
          for (const reading of readings) {
            await executeQuery(
              `INSERT OR REPLACE INTO daily_readings 
               (id, station_id, operator_id, reading_date, ph_level, tds_level, 
                temperature, pressure, tank_level_percentage, notes, notes_ar, is_synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              [
                reading.id,
                reading.stationId,
                reading.operatorId,
                reading.readingDate,
                reading.phLevel,
                reading.tdsLevel,
                reading.temperature,
                reading.pressure,
                reading.tankLevelPercentage,
                reading.notes,
                reading.notesAr
              ]
            );
          }
        }

        // Store faults locally
        if (faults && faults.length > 0) {
          for (const fault of faults) {
            await executeQuery(
              `INSERT OR REPLACE INTO faults 
               (id, station_id, reported_by, title, title_ar, description, description_ar,
                priority, latitude, longitude, photo_url, is_synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              [
                fault.id,
                fault.stationId,
                fault.reportedBy,
                fault.title,
                fault.titleAr,
                fault.description,
                fault.descriptionAr,
                fault.priority,
                fault.latitude,
                fault.longitude,
                fault.photoUrl
              ]
            );
          }
        }
      }
    } catch (error) {
      result.errors.push(`Download error: ${error.message}`);
    }
  }

  async getSyncStatus(): Promise<{
    isOnline: boolean;
    unsyncedReadings: number;
    unsyncedFaults: number;
    lastSync?: string;
  }> {
    const online = await isOnline();
    
    const unsyncedReadings = await executeQuery(
      'SELECT COUNT(*) as count FROM daily_readings WHERE is_synced = 0'
    );
    
    const unsyncedFaults = await executeQuery(
      'SELECT COUNT(*) as count FROM faults WHERE is_synced = 0'
    );

    const lastSync = await executeQuery(
      'SELECT MAX(updated_at) as last_sync FROM daily_readings WHERE is_synced = 1'
    );

    return {
      isOnline: online,
      unsyncedReadings: unsyncedReadings.rows[0]?.count || 0,
      unsyncedFaults: unsyncedFaults.rows[0]?.count || 0,
      lastSync: lastSync.rows[0]?.last_sync
    };
  }
}

export default SyncService.getInstance();
