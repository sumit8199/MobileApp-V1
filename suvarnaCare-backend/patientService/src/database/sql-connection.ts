import mysql, { Pool } from 'mysql2/promise';
import { dbConfig } from '../config/db.config.js';

let pool: Pool | null = null;
let isConnected = false;

/**
 * Initializes and connects to MySQL database with connection pooling.
 * Automatically runs schema creation DDL and seed data.
 */
export async function connectSqlServer(): Promise<Pool | null> {
  try {
    console.log(`🔌 [MySQL - PatientService] Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

    // First ensure database exists
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConnection.end();

    // Create pool for target database
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: dbConfig.waitForConnections,
      connectionLimit: dbConfig.connectionLimit,
      queueLimit: dbConfig.queueLimit,
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    isConnected = true;
    console.log(`✅ [MySQL - PatientService] Connected successfully to ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);

    await initializeDatabaseSchema(pool);
    return pool;
  } catch (error: any) {
    isConnected = false;
    console.warn(`⚠️ [MySQL - PatientService] Connection failed (${error.message}). Running in fallback mode.`);
    return null;
  }
}

/**
 * Ensures required tables and indexes exist in MySQL.
 */
export async function initializeDatabaseSchema(activePool: Pool): Promise<void> {
  try {
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS Patients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        birth_date VARCHAR(20) NOT NULL,
        parent_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        registration_date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patients_phone (phone),
        INDEX idx_patients_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS PatientSessionHistory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id VARCHAR(50) NOT NULL,
        pushya_date VARCHAR(20) NOT NULL,
        visited TINYINT(1) DEFAULT 0,
        visited_at VARCHAR(50) NULL,
        dose_administered TINYINT(1) DEFAULT 0,
        notes TEXT NULL,
        stage1_status VARCHAR(50) DEFAULT 'scheduled',
        stage1_at VARCHAR(50) NULL,
        stage2_status VARCHAR(50) DEFAULT 'scheduled',
        stage2_at VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE,
        UNIQUE KEY uq_patient_pushya (patient_id, pushya_date),
        INDEX idx_session_date (pushya_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist on existing tables
    try { await activePool.query(`ALTER TABLE PatientSessionHistory ADD COLUMN visited TINYINT(1) DEFAULT 0;`); } catch (_) {}
    try { await activePool.query(`ALTER TABLE PatientSessionHistory ADD COLUMN visited_at VARCHAR(50) NULL;`); } catch (_) {}
    try { await activePool.query(`ALTER TABLE PatientSessionHistory ADD COLUMN dose_administered TINYINT(1) DEFAULT 0;`); } catch (_) {}
    try { await activePool.query(`ALTER TABLE PatientSessionHistory ADD COLUMN notes TEXT NULL;`); } catch (_) {}

    console.log('✅ [MySQL - PatientService] Schema verified & initialized.');
    await seedInitialData(activePool);
  } catch (error: any) {
    console.error('❌ [MySQL - PatientService] Schema initialization error:', error.message);
  }
}

/**
 * Seeds initial demo patients if database is empty.
 */
async function seedInitialData(activePool: Pool): Promise<void> {
  try {
    const [rows]: any = await activePool.query('SELECT COUNT(*) as count FROM Patients');
    if (rows[0]?.count === 0) {
      console.log('🌱 [MySQL - PatientService] Seeding default patients into MySQL...');

      const seedPatients = [
        { id: '1', name: 'Arjun Sharma', birthDate: '2024-06-15', parent_name: 'Vikram Sharma', phone: '9876543210', reg: '2026-02-15' },
        { id: '2', name: 'Priya Patel', birthDate: '2025-02-10', parent_name: 'Suresh Patel', phone: '9876543211', reg: '2026-04-10' },
        { id: '3', name: 'Kavya Nair', birthDate: '2023-08-20', parent_name: 'Rajan Nair', phone: '9876543212', reg: '2026-03-20' },
        { id: '4', name: 'Rohan Desai', birthDate: '2025-12-05', parent_name: 'Amit Desai', phone: '9876543213', reg: '2026-05-05' },
        { id: '5', name: 'Ananya Joshi', birthDate: '2024-02-12', parent_name: 'Deepak Joshi', phone: '9876543214', reg: '2026-06-12' },
      ];

      for (const p of seedPatients) {
        await activePool.execute(
          'INSERT INTO Patients (id, name, birth_date, parent_name, phone, registration_date) VALUES (?, ?, ?, ?, ?, ?)',
          [p.id, p.name, p.birthDate, p.parent_name, p.phone, p.reg]
        );

        await activePool.execute(
          'INSERT INTO PatientSessionHistory (patient_id, pushya_date, visited, visited_at, dose_administered) VALUES (?, ?, 1, ?, 1)',
          [p.id, '2026-06-21', '09:15 AM']
        );
      }
      console.log('✅ [MySQL - PatientService] Seed data applied successfully in MySQL.');
    }
  } catch (err: any) {
    console.warn('⚠️ [MySQL - PatientService] Seed check error:', err.message);
  }
}

export function getSqlPool(): Pool | null {
  return pool;
}

export function isSqlConnected(): boolean {
  return isConnected && pool !== null;
}

export async function closeSqlServer(): Promise<void> {
  if (pool) {
    await pool.end();
    isConnected = false;
    console.log('🔌 [MySQL - PatientService] Connection pool closed.');
  }
}
