import mysql, { Pool } from 'mysql2/promise';
import { dbConfig } from '../config/db.config.js';

let pool: Pool | null = null;
let isConnected = false;

/**
 * Initializes and connects to MySQL database for ReminderService.
 * Automatically runs schema creation DDL and seed data.
 */
export async function connectSqlServer(): Promise<Pool | null> {
  try {
    console.log(`🔌 [MySQL - ReminderService] Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

    // Ensure database exists
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConnection.end();

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
    console.log(`✅ [MySQL - ReminderService] Connected successfully to ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);

    await initializeDatabaseSchema(pool);
    return pool;
  } catch (error: any) {
    isConnected = false;
    console.warn(`⚠️ [MySQL - ReminderService] Connection failed (${error.message}). Running in fallback mode.`);
    return null;
  }
}

/**
 * Ensures required tables and indexes exist in MySQL.
 */
export async function initializeDatabaseSchema(activePool: Pool): Promise<void> {
  try {
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS PushyaDates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pushya_date VARCHAR(20) NOT NULL UNIQUE,
        stage1_fire_date VARCHAR(20) NOT NULL,
        stage2_fire_date VARCHAR(20) NOT NULL,
        label VARCHAR(100) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS Reminders (
        id VARCHAR(50) PRIMARY KEY,
        patient_id VARCHAR(50) NOT NULL,
        patient_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        pushya_date VARCHAR(20) NOT NULL,
        stage INT NOT NULL,
        scheduled_date VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        sent_at VARCHAR(50) NULL,
        delivered_at VARCHAR(50) NULL,
        read_at VARCHAR(50) NULL,
        message_content TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rem_pushya (pushya_date),
        INDEX idx_rem_stage (stage),
        INDEX idx_rem_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS ReminderLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reminder_id VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details TEXT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ [MySQL - ReminderService] Schema verified & initialized.');
    await seedInitialData(activePool);
  } catch (error: any) {
    console.error('❌ [MySQL - ReminderService] Schema initialization error:', error.message);
  }
}

/**
 * Seeds Pushya dates and demo reminders into MySQL if empty.
 */
async function seedInitialData(activePool: Pool): Promise<void> {
  try {
    const [rows]: any = await activePool.query('SELECT COUNT(*) as count FROM PushyaDates');
    if (rows[0]?.count === 0) {
      console.log('🌱 [MySQL - ReminderService] Seeding default Pushya dates...');

      const pushyaDates = [
        { date: '2026-06-21', s1: '2026-06-20', s2: '2026-06-21', label: 'Ashadha Pushya' },
        { date: '2026-07-18', s1: '2026-07-17', s2: '2026-07-18', label: 'Shravana Pushya' },
        { date: '2026-08-14', s1: '2026-08-13', s2: '2026-08-14', label: 'Bhadrapada Pushya' },
        { date: '2026-09-10', s1: '2026-09-09', s2: '2026-09-10', label: 'Ashwina Pushya' },
        { date: '2026-10-07', s1: '2026-10-06', s2: '2026-10-07', label: 'Kartika Pushya' },
        { date: '2026-11-03', s1: '2026-11-02', s2: '2026-11-03', label: 'Margashirsha Pushya' },
        { date: '2026-12-01', s1: '2026-11-30', s2: '2026-12-01', label: 'Pausha Pushya' },
      ];

      for (const p of pushyaDates) {
        await activePool.execute(
          'INSERT INTO PushyaDates (pushya_date, stage1_fire_date, stage2_fire_date, label, is_active) VALUES (?, ?, ?, ?, 1)',
          [p.date, p.s1, p.s2, p.label]
        );
      }

      console.log('🌱 [MySQL - ReminderService] Seeding default reminders for all patients across all Pushya dates...');
      const seedPatients = [
        { pid: '1', name: 'Arjun Sharma', phone: '9876543210' },
        { pid: '2', name: 'Priya Patel', phone: '9876543211' },
        { pid: '3', name: 'Kavya Nair', phone: '9876543212' },
        { pid: '4', name: 'Rohan Desai', phone: '9876543213' },
        { pid: '5', name: 'Ananya Joshi', phone: '9876543214' },
      ];

      for (const p of seedPatients) {
        for (const pushya of pushyaDates) {
          const isPast = pushya.date === '2026-06-21';
          const stage1Status = isPast ? 'read' : 'scheduled';

          // WhatsApp Reminder (1 day before Pushya date)
          await activePool.execute(
            `INSERT INTO Reminders (id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status)`,
            [
              `rem-${p.pid}-${pushya.date}-s1`,
              p.pid,
              p.name,
              p.phone,
              pushya.date,
              1,
              pushya.s1,
              stage1Status,
            ]
          );
        }
      }

      console.log('✅ [MySQL - ReminderService] Seed data applied successfully across all Pushya dates.');
    }
  } catch (err: any) {
    console.warn('⚠️ [MySQL - ReminderService] Seed check error:', err.message);
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
    console.log('🔌 [MySQL - ReminderService] Connection pool closed.');
  }
}
