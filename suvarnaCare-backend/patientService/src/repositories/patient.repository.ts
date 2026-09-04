import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  IPatientEntity,
  IPatientDbRow,
  IPatientFilterQuery,
  IPatientSessionRecord,
} from '../interfaces/patient.backend.interface';
import {
  CreatePatientRequestDto,
  UpdatePatientRequestDto,
  AddSessionHistoryRequestDto,
  calculateAge,
} from '../dtos/patient.backend.dto';
import { getSqlPool, isSqlConnected } from '../database/sql-connection';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '../../data/patients.db.json');

const DEFAULT_PATIENTS: IPatientEntity[] = [
  {
    id: '1',
    name: 'Arjun Sharma',
    birthDate: '2024-06-15',
    phone: '9876543210',
    registrationDate: '2026-02-15',
    history: {
      '2026-06-21': { sessionDate: '2026-06-21', attended: true, attendedAt: '09:15 AM', visited: true, visitedAt: '09:15 AM', doseAdministered: true },
      '2026-07-18': { sessionDate: '2026-07-18', attended: true, attendedAt: '10:30 AM', visited: true, visitedAt: '10:30 AM', doseAdministered: true },
    },
  },
  {
    id: '2',
    name: 'Priya Patel',
    birthDate: '2025-02-10',
    phone: '9876543211',
    registrationDate: '2026-04-10',
    history: {
      '2026-06-21': { sessionDate: '2026-06-21', attended: true, attendedAt: '09:45 AM', visited: true, visitedAt: '09:45 AM', doseAdministered: true },
    },
  },
  {
    id: '3',
    name: 'Kavya Nair',
    birthDate: '2023-08-20',
    phone: '9876543212',
    registrationDate: '2026-03-20',
    history: {},
  },
  {
    id: '4',
    name: 'Rohan Desai',
    birthDate: '2025-12-05',
    phone: '9876543213',
    registrationDate: '2026-05-05',
    history: {
      '2026-06-21': { sessionDate: '2026-06-21', attended: true, attendedAt: '11:10 AM', visited: true, visitedAt: '11:10 AM', doseAdministered: true },
      '2026-07-18': { sessionDate: '2026-07-18', attended: true, attendedAt: '10:05 AM', visited: true, visitedAt: '10:05 AM', doseAdministered: true },
    },
  },
  {
    id: '5',
    name: 'Ananya Joshi',
    birthDate: '2024-02-12',
    phone: '9876543214',
    registrationDate: '2026-06-12',
    history: {},
  },
];

export class PatientRepository {
  private inMemoryPatients: IPatientEntity[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.inMemoryPatients = JSON.parse(raw);
      } else {
        this.inMemoryPatients = [...DEFAULT_PATIENTS];
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('⚠️ [PatientRepository] Could not read JSON disk file, using defaults');
      this.inMemoryPatients = [...DEFAULT_PATIENTS];
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.inMemoryPatients, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn('⚠️ [PatientRepository] Disk persistence warning:', err.message);
    }
  }

  /**
   * Retrieves all patients from MySQL if online, else in-memory.
   */
  async findAll(query?: IPatientFilterQuery): Promise<IPatientEntity[]> {
    const pool = getSqlPool();

    if (isSqlConnected() && pool) {
      try {
        let sql = `
          SELECT 
            p.id, p.name, p.birth_date, p.phone, p.registration_date,
            h.pushya_date, h.stage1_status, h.stage1_at, h.stage2_status, h.stage2_at,
            h.visited, h.visited_at, h.dose_administered, h.notes
          FROM Patients p
          LEFT JOIN PatientSessionHistory h ON p.id = h.patient_id
        `;
        const params: any[] = [];

        if (query?.search) {
          sql += ` WHERE p.name LIKE ? OR p.phone LIKE ?`;
          const term = `%${query.search}%`;
          params.push(term, term);
        }

        sql += ` ORDER BY p.name ASC`;

        const [rows]: any = await pool.query(sql, params);
        return this.mapSqlRowsToEntities(rows);
      } catch (err: any) {
        console.warn('⚠️ [PatientRepository] MySQL query failed, using in-memory store:', err.message);
      }
    }

    let list = [...this.inMemoryPatients];
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }
    return list.map((p) => ({ ...p, age: calculateAge(p.birthDate) }));
  }

  /**
   * Finds single patient by ID from MySQL.
   */
  async findById(id: string): Promise<IPatientEntity | null> {
    const pool = getSqlPool();

    if (isSqlConnected() && pool) {
      try {
        const [rows]: any = await pool.query(
          `SELECT 
            p.id, p.name, p.birth_date, p.phone, p.registration_date,
            h.pushya_date, h.stage1_status, h.stage1_at, h.stage2_status, h.stage2_at,
            h.visited, h.visited_at, h.dose_administered, h.notes
          FROM Patients p
          LEFT JOIN PatientSessionHistory h ON p.id = h.patient_id
          WHERE p.id = ?`,
          [id]
        );

        if (rows.length === 0) return null;
        const entities = this.mapSqlRowsToEntities(rows);
        return entities[0] || null;
      } catch (err: any) {
        console.warn('⚠️ [PatientRepository] MySQL findById error:', err.message);
      }
    }

    const found = this.inMemoryPatients.find((p) => p.id === id);
    if (!found) return null;
    return { ...found, age: calculateAge(found.birthDate) };
  }

  /**
   * Inserts new patient into store with empty history.
   */
  async create(dto: CreatePatientRequestDto): Promise<IPatientEntity> {
    const id = Date.now().toString();
    const regDate = dto.registrationDate || new Date().toISOString().split('T')[0];
    const birthDate = dto.birthDate || '';

    const newPatient: IPatientEntity = {
      id,
      name: dto.name,
      birthDate,
      age: calculateAge(birthDate),
      phone: dto.phone,
      registrationDate: regDate,
      history: {},
    };

    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        await pool.execute(
          `INSERT INTO Patients (id, name, birth_date, phone, registration_date)
           VALUES (?, ?, ?, ?, ?)`,
          [id, dto.name, birthDate, dto.phone, regDate]
        );
      } catch (err: any) {
        console.warn('⚠️ [PatientRepository] MySQL patient insert error:', err.message);
      }
    }

    this.inMemoryPatients.unshift(newPatient);
    this.saveToDisk();
    return newPatient;
  }

  /**
   * Updates patient details.
   */
  async update(id: string, dto: UpdatePatientRequestDto): Promise<IPatientEntity | null> {
    const pool = getSqlPool();

    if (isSqlConnected() && pool) {
      try {
        const fields: string[] = [];
        const values: any[] = [];

        if (dto.name) { fields.push('name = ?'); values.push(dto.name); }
        if (dto.birthDate) { fields.push('birth_date = ?'); values.push(dto.birthDate); }
        if (dto.phone) { fields.push('phone = ?'); values.push(dto.phone); }
        if (dto.registrationDate) { fields.push('registration_date = ?'); values.push(dto.registrationDate); }

        if (fields.length > 0) {
          values.push(id);
          await pool.execute(
            `UPDATE Patients SET ${fields.join(', ')} WHERE id = ?`,
            values
          );
        }
        return this.findById(id);
      } catch (err: any) {
        console.warn('⚠️ [PatientRepository] MySQL update error:', err.message);
      }
    }

    const patient = this.inMemoryPatients.find((p) => p.id === id);
    if (!patient) return null;

    if (dto.name) patient.name = dto.name;
    if (dto.birthDate) {
      patient.birthDate = dto.birthDate;
      patient.age = calculateAge(dto.birthDate);
    }
    if (dto.phone) patient.phone = dto.phone;
    if (dto.registrationDate) patient.registrationDate = dto.registrationDate;

    this.saveToDisk();
    return patient;
  }

  /**
   * Deletes patient and their session history.
   */
  async delete(id: string): Promise<boolean> {
    const pool = getSqlPool();

    if (isSqlConnected() && pool) {
      try {
        await pool.execute(`DELETE FROM PatientSessionHistory WHERE patient_id = ?`, [id]);
        const [res]: any = await pool.execute(`DELETE FROM Patients WHERE id = ?`, [id]);
        return res.affectedRows > 0;
      } catch (err: any) {
        console.warn('⚠️ [PatientRepository] MySQL delete error:', err.message);
      }
    }

    const idx = this.inMemoryPatients.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    this.inMemoryPatients.splice(idx, 1);
    this.saveToDisk();
    return true;
  }

  /**
   * Saves or updates session attendance in patient.history.
   */
  async saveHistory(id: string, history: AddSessionHistoryRequestDto): Promise<IPatientEntity | null> {
    const sessionDate = history.pushyaDate || history.sessionDate;
    if (!sessionDate) return this.findById(id);

    const isAttended = history.attended !== undefined
      ? Boolean(history.attended)
      : (history.visited !== undefined ? Boolean(history.visited) : true);

    const attendedTime = history.attendedAt || history.visitedAt || (isAttended ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined);

    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        await pool.execute(
          `INSERT INTO PatientSessionHistory (patient_id, pushya_date, visited, visited_at, dose_administered, notes)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             visited = VALUES(visited),
             visited_at = VALUES(visited_at),
             dose_administered = VALUES(dose_administered),
             notes = VALUES(notes)`,
          [
            id,
            sessionDate,
            isAttended ? 1 : 0,
            isAttended ? (attendedTime ?? null) : null,
            isAttended ? 1 : 0,
            history.notes || null,
          ] as any[]
        );
        return this.findById(id);
      } catch (err: any) {
        console.warn('⚠️ [PatientRepository] MySQL saveHistory error:', err.message);
      }
    }

    const patient = this.inMemoryPatients.find((p) => p.id === id);
    if (!patient) return null;

    if (!patient.history) {
      patient.history = {};
    }

    patient.history[sessionDate] = {
      sessionDate,
      attended: isAttended,
      attendedAt: isAttended ? attendedTime : undefined,
      visited: isAttended,
      visitedAt: isAttended ? attendedTime : undefined,
      doseAdministered: history.doseAdministered !== undefined ? Boolean(history.doseAdministered) : isAttended,
      notes: history.notes,
    };

    this.saveToDisk();
    return patient;
  }

  private mapSqlRowsToEntities(rows: any[]): IPatientEntity[] {
    const map = new Map<string, IPatientEntity>();

    for (const r of rows) {
      if (!map.has(r.id)) {
        const birthDate = r.birth_date || '';
        map.set(r.id, {
          id: r.id,
          name: r.name,
          birthDate,
          age: calculateAge(birthDate),
          phone: r.phone,
          registrationDate: r.registration_date,
          history: {},
        });
      }

      if (r.pushya_date) {
        const entity = map.get(r.id)!;
        const isAttended = Boolean(r.visited ?? r.attended);
        entity.history[r.pushya_date] = {
          sessionDate: r.pushya_date,
          attended: isAttended,
          attendedAt: r.visited_at || r.attended_at || undefined,
          visited: isAttended,
          visitedAt: r.visited_at || r.attended_at || undefined,
          doseAdministered: Boolean(r.dose_administered),
          notes: r.notes || undefined,
        };
      }
    }

    return Array.from(map.values());
  }
}
