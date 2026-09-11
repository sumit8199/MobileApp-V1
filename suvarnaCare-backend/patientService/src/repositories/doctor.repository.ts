import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  IDoctorEntity,
  IDoctorDbRow,
  ICreateDoctorDto,
} from '../interfaces/doctor.backend.interface.js';
import { getSqlPool, isSqlConnected } from '../database/sql-connection.js';
import { hashPassword } from '../utils/password.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '../../data/doctors.db.json');

const DEFAULT_DOCTORS: IDoctorEntity[] = [
  {
    id: 'usr_demo_001',
    email: 'doctor@suvarnacare.com',
    password: hashPassword('Password@123'),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export class DoctorRepository {
  constructor() {
    this.ensureDataFileExists();
  }

  private ensureDataFileExists(): void {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE_PATH)) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(DEFAULT_DOCTORS, null, 2), 'utf-8');
      }
    } catch (err: any) {
      console.warn('⚠️ [DoctorRepository] Could not initialize fallback JSON storage:', err.message);
    }
  }

  private readFallbackData(): IDoctorEntity[] {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err: any) {
      console.warn('⚠️ [DoctorRepository] Fallback file read error:', err.message);
    }
    return DEFAULT_DOCTORS;
  }

  private writeFallbackData(doctors: IDoctorEntity[]): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(doctors, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn('⚠️ [DoctorRepository] Fallback file write error:', err.message);
    }
  }

  private mapRowToEntity(row: IDoctorDbRow): IDoctorEntity {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  /**
   * Find doctor by email in MySQL (or JSON fallback).
   */
  async findByEmailOrPhone(identifier: string): Promise<IDoctorEntity | null> {
    return this.findByEmail(identifier);
  }

  /**
   * Find doctor by email in MySQL (or JSON fallback).
   */
  async findByEmail(email: string): Promise<IDoctorEntity | null> {
    const cleanEmail = email.trim().toLowerCase();

    if (isSqlConnected()) {
      const pool = getSqlPool();
      if (pool) {
        try {
          const [rows]: any = await pool.execute(
            'SELECT id, email, password, created_at, updated_at FROM Doctors WHERE LOWER(email) = ? LIMIT 1',
            [cleanEmail]
          );
          if (rows && rows.length > 0) {
            return this.mapRowToEntity(rows[0]);
          }
        } catch (err: any) {
          console.warn('⚠️ [DoctorRepository] MySQL findByEmail query failed, checking fallback:', err.message);
        }
      }
    }

    // Fallback JSON search
    const doctors = this.readFallbackData();
    const found = doctors.find((d) => d.email.toLowerCase() === cleanEmail);
    return found || null;
  }

  /**
   * Find doctor by ID in MySQL (or JSON fallback).
   */
  async findById(id: string): Promise<IDoctorEntity | null> {
    if (isSqlConnected()) {
      const pool = getSqlPool();
      if (pool) {
        try {
          const [rows]: any = await pool.execute(
            'SELECT id, email, password, created_at, updated_at FROM Doctors WHERE id = ? LIMIT 1',
            [id]
          );
          if (rows && rows.length > 0) {
            return this.mapRowToEntity(rows[0]);
          }
        } catch (err: any) {
          console.warn('⚠️ [DoctorRepository] MySQL findById query failed, checking fallback:', err.message);
        }
      }
    }

    const doctors = this.readFallbackData();
    const found = doctors.find((d) => d.id === id);
    return found || null;
  }

  /**
   * Create a new doctor storing only email and hashed password in MySQL (and update JSON fallback).
   */
  async create(dto: ICreateDoctorDto): Promise<IDoctorEntity> {
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const hashedPassword = hashPassword(dto.password);
    const cleanEmail = dto.email.trim().toLowerCase();

    const newDoctor: IDoctorEntity = {
      id: newId,
      email: cleanEmail,
      password: hashedPassword,
      createdAt: now,
    };

    if (isSqlConnected()) {
      const pool = getSqlPool();
      if (pool) {
        try {
          await pool.execute(
            `INSERT INTO Doctors (id, email, password) VALUES (?, ?, ?)`,
            [newDoctor.id, newDoctor.email, hashedPassword]
          );
        } catch (err: any) {
          console.warn('⚠️ [DoctorRepository] MySQL create doctor failed, writing to fallback:', err.message);
        }
      }
    }

    // Always update fallback JSON cache
    const doctors = this.readFallbackData();
    doctors.push(newDoctor);
    this.writeFallbackData(doctors);

    return newDoctor;
  }
}
