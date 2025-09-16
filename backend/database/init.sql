-- Operator App Database Schema
-- PostgreSQL initialization script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'operator');
CREATE TYPE station_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE fault_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE fault_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'operator',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stations table
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_name_ar VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    address_ar TEXT,
    status station_status DEFAULT 'active',
    capacity_liters INTEGER,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily readings table
CREATE TABLE daily_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES users(id),
    reading_date DATE NOT NULL,
    ph_level DECIMAL(4, 2) CHECK (ph_level >= 0 AND ph_level <= 14),
    tds_level INTEGER CHECK (tds_level >= 0),
    temperature DECIMAL(5, 2),
    pressure DECIMAL(6, 2),
    tank_level_percentage INTEGER CHECK (tank_level_percentage >= 0 AND tank_level_percentage <= 100),
    notes TEXT,
    notes_ar TEXT,
    is_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, reading_date)
);

-- Faults table
CREATE TABLE faults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    status fault_status DEFAULT 'open',
    priority fault_priority DEFAULT 'medium',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    photo_url VARCHAR(500),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync logs table for offline data
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    data JSONB,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stations_operator ON stations(operator_id);
CREATE INDEX idx_stations_status ON stations(status);
CREATE INDEX idx_readings_station_date ON daily_readings(station_id, reading_date);
CREATE INDEX idx_readings_operator ON daily_readings(operator_id);
CREATE INDEX idx_faults_station ON faults(station_id);
CREATE INDEX idx_faults_status ON faults(status);
CREATE INDEX idx_faults_assigned ON faults(assigned_to);
CREATE INDEX idx_sync_logs_user ON sync_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_readings_updated_at BEFORE UPDATE ON daily_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faults_updated_at BEFORE UPDATE ON faults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, phone) 
VALUES (
    'admin@operator.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Admin', 
    'User', 
    'admin',
    '+1234567890'
);

-- Insert default operator user (password: operator123)
INSERT INTO users (email, password_hash, first_name, last_name, role, phone) 
VALUES (
    'operator@operator.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Operator', 
    'User', 
    'operator',
    '+1234567891'
);

-- Insert sample stations
INSERT INTO stations (name, name_ar, location_name, location_name_ar, latitude, longitude, address, address_ar, capacity_liters, operator_id)
VALUES 
    ('Station Alpha', 'محطة ألفا', 'Downtown', 'وسط المدينة', 33.5138, 36.2765, '123 Main Street', 'شارع الرئيسي 123', 50000, (SELECT id FROM users WHERE email = 'operator@operator.com')),
    ('Station Beta', 'محطة بيتا', 'Industrial Zone', 'المنطقة الصناعية', 33.5200, 36.2800, '456 Industrial Ave', 'شارع الصناعي 456', 75000, (SELECT id FROM users WHERE email = 'operator@operator.com')),
    ('Station Gamma', 'محطة غاما', 'Residential Area', 'المنطقة السكنية', 33.5000, 36.2600, '789 Residential Blvd', 'شارع السكني 789', 30000, (SELECT id FROM users WHERE email = 'operator@operator.com'));
