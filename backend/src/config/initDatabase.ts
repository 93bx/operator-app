import { getPool } from './database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export const initDatabase = async (): Promise<void> => {
  try {
    const pool = getPool();
    
    logger.info('Initializing database tables...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL DEFAULT 'operator',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create stations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255) NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        location_name_ar VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        address VARCHAR(500),
        address_ar VARCHAR(500),
        capacity_liters INTEGER,
        operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create readings table (daily_readings)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_readings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ph_level DECIMAL(4, 2),
        tds_level DECIMAL(6, 2),
        temperature DECIMAL(5, 2),
        pressure DECIMAL(6, 2),
        tank_level_percentage DECIMAL(5, 2),
        notes TEXT,
        notes_ar TEXT,
        is_synced BOOLEAN NOT NULL DEFAULT false,
        reading_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create faults table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faults (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        title_ar VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        description_ar TEXT NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        photo_url VARCHAR(500),
        resolution_notes TEXT,
        reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create fault_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fault_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fault_id UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sync_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sync_type VARCHAR(50) NOT NULL,
        record_id UUID NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database tables created successfully');

    // Check if we need to seed data
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count === '0') {
      logger.info('Seeding initial data...');
      await seedInitialData(pool);
    }

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

const seedInitialData = async (pool: any): Promise<void> => {
  try {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['admin@operator.com', adminPasswordHash, 'Admin', 'User', 'admin', true]);

    // Create operator user
    const operatorPasswordHash = await bcrypt.hash('operator123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['operator@operator.com', operatorPasswordHash, 'Operator', 'User', 'operator', true]);

    // Get the operator user ID for assignment
    const operatorResult = await pool.query('SELECT id FROM users WHERE role = $1', ['operator']);
    const operatorId = operatorResult.rows[0]?.id;

    // Create sample stations
    await pool.query(`
      INSERT INTO stations (name, name_ar, location_name, location_name_ar, latitude, longitude, address, address_ar, capacity_liters, operator_id, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11),
        ($12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22),
        ($23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
    `, [
      'Station 1', 'محطة 1', 'Downtown', 'وسط المدينة', 31.2001, 29.9187, 
      '123 Main Street', '123 الشارع الرئيسي', 5000, operatorId, 'active',
      'Station 2', 'محطة 2', 'Industrial Area', 'المنطقة الصناعية', 31.2501, 29.9500,
      '456 Industrial Blvd', '456 شارع الصناعية', 8000, operatorId, 'active',
      'Station 3', 'محطة 3', 'Residential Area', 'المنطقة السكنية', 31.1800, 29.9000,
      '789 Residential Ave', '789 شارع السكنية', 3000, operatorId, 'active'
    ]);

    // Get station IDs for sample data
    const stationsResult = await pool.query('SELECT id FROM stations ORDER BY created_at LIMIT 3');
    const stationIds = stationsResult.rows.map((row: any) => row.id);

    // Create sample readings
    for (let i = 0; i < 5; i++) {
      const stationId = stationIds[i % stationIds.length];
      const readingDate = new Date();
      readingDate.setDate(readingDate.getDate() - i);
      
      await pool.query(`
        INSERT INTO daily_readings (station_id, operator_id, ph_level, tds_level, temperature, pressure, tank_level_percentage, notes, notes_ar, reading_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        stationId, operatorId,
        7.2 + (Math.random() - 0.5) * 0.4, // pH between 7.0-7.4
        150 + Math.random() * 100, // TDS 150-250
        25 + Math.random() * 10, // Temperature 25-35°C
        2.5 + Math.random() * 1.0, // Pressure 2.5-3.5 bar
        60 + Math.random() * 30, // Tank level 60-90%
        `Reading ${i + 1} - Normal operation`,
        `قراءة ${i + 1} - تشغيل طبيعي`,
        readingDate
      ]);
    }

    // Create sample faults
    const faultTitles = [
      ['Low Water Pressure', 'ضغط ماء منخفض'],
      ['Temperature Anomaly', 'شذوذ في درجة الحرارة'],
      ['Equipment Malfunction', 'عطل في المعدات']
    ];

    for (let i = 0; i < 3; i++) {
      const stationId = stationIds[i];
      const [title, titleAr] = faultTitles[i];
      
      await pool.query(`
        INSERT INTO faults (station_id, reported_by, title, title_ar, description, description_ar, priority, status, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        stationId, operatorId, title, titleAr,
        `Fault description ${i + 1} - Equipment needs attention`,
        `وصف العطل ${i + 1} - المعدات تحتاج إلى انتباه`,
        ['medium', 'high', 'low'][i],
        ['open', 'assigned', 'in_progress'][i],
        31.2001 + (Math.random() - 0.5) * 0.01,
        29.9187 + (Math.random() - 0.5) * 0.01
      ]);
    }

    logger.info('Initial data seeded successfully');
    logger.info('Admin credentials: admin@operator.com / admin123');
    logger.info('Operator credentials: operator@operator.com / operator123');

  } catch (error) {
    logger.error('Failed to seed initial data:', error);
    throw error;
  }
};
