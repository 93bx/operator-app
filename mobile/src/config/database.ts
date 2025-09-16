import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('operator_app.db');

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Create users table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            is_active INTEGER DEFAULT 1,
            last_login TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create stations table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS stations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_ar TEXT NOT NULL,
            location_name TEXT NOT NULL,
            location_name_ar TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address TEXT,
            address_ar TEXT,
            status TEXT DEFAULT 'active',
            capacity_liters INTEGER,
            operator_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create readings table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS daily_readings (
            id TEXT PRIMARY KEY,
            station_id TEXT NOT NULL,
            operator_id TEXT NOT NULL,
            reading_date TEXT NOT NULL,
            ph_level REAL,
            tds_level INTEGER,
            temperature REAL,
            pressure REAL,
            tank_level_percentage INTEGER,
            notes TEXT,
            notes_ar TEXT,
            is_synced INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (station_id) REFERENCES stations (id),
            FOREIGN KEY (operator_id) REFERENCES users (id)
          );
        `);

        // Create faults table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS faults (
            id TEXT PRIMARY KEY,
            station_id TEXT NOT NULL,
            reported_by TEXT NOT NULL,
            assigned_to TEXT,
            title TEXT NOT NULL,
            title_ar TEXT NOT NULL,
            description TEXT NOT NULL,
            description_ar TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            priority TEXT DEFAULT 'medium',
            latitude REAL,
            longitude REAL,
            photo_url TEXT,
            resolved_at TEXT,
            is_synced INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (station_id) REFERENCES stations (id),
            FOREIGN KEY (reported_by) REFERENCES users (id),
            FOREIGN KEY (assigned_to) REFERENCES users (id)
          );
        `);

        // Create sync_logs table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS sync_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            action TEXT NOT NULL,
            data TEXT,
            synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
        `);

        // Create indexes for better performance
        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_readings_station_date 
          ON daily_readings (station_id, reading_date);
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_readings_operator 
          ON daily_readings (operator_id);
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_faults_station 
          ON faults (station_id);
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_faults_status 
          ON faults (status);
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_sync_logs_user 
          ON sync_logs (user_id);
        `);
      },
      (error) => {
        console.error('Database initialization error:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
};

export const executeQuery = (
  sql: string,
  params: any[] = []
): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            console.error('Query error:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
};

export const executeTransaction = (
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        queries.forEach(({ sql, params = [] }) => {
          tx.executeSql(sql, params);
        });
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};

export default db;
