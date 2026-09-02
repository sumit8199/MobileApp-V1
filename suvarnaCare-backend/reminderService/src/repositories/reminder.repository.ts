import fs from 'fs';
import path from 'path';
import { getSqlPool, isSqlConnected } from '../database/sql-connection.js';
import {
  IReminderEntity,
  IReminderFilterQuery,
  IPushyaDateEntity,
  IReminderStats,
  IWhatsAppLogEntity,
  ReminderStage,
} from '../interfaces/reminder.backend.interface.js';
import {
  CreateReminderRequestDto,
  UpdateReminderStatusDto,
} from '../dtos/reminder.backend.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'reminders.db.json');

export class ReminderRepository {
  private inMemoryPushyaDates: IPushyaDateEntity[] = [];
  private inMemoryReminders: IReminderEntity[] = [];
  private inMemoryLogs: IWhatsAppLogEntity[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.inMemoryPushyaDates = data.pushyaDates || [];
        this.inMemoryReminders = data.reminders || [];
        this.inMemoryLogs = data.logs || [];
      }
    } catch {}
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        pushyaDates: this.inMemoryPushyaDates,
        reminders: this.inMemoryReminders,
        logs: this.inMemoryLogs,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }

  /**
   * Retrieves active Pushya Dates from MySQL or in-memory fallback.
   */
  async getPushyaDates(): Promise<IPushyaDateEntity[]> {
    const pool = getSqlPool();

    if (isSqlConnected() && pool) {
      try {
        const [rows]: any = await pool.query(`
          SELECT pushya_date, stage1_fire_date, stage2_fire_date, label, is_active
          FROM PushyaDates
          WHERE is_active = 1
          ORDER BY pushya_date ASC
        `);

        return rows.map((r: any) => ({
          pushyaDate: r.pushya_date,
          stage1FireDate: r.stage1_fire_date,
          stage2FireDate: r.stage2_fire_date,
          label: r.label,
          isActive: Boolean(r.is_active),
        }));
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL getPushyaDates error:', err.message);
      }
    }

    return this.inMemoryPushyaDates.filter((p) => p.isActive);
  }

  /**
   * Adds or updates a Pushya calendar date.
   */
  async addPushyaDate(pushyaDate: string, label?: string): Promise<IPushyaDateEntity> {
    // Calculate stage 1 fire date (3 days before)
    const parts = pushyaDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() - 3);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const stage1FireDate = `${yyyy}-${mm}-${dd}`;
    const stage2FireDate = pushyaDate;

    const entity: IPushyaDateEntity = {
      pushyaDate,
      stage1FireDate,
      stage2FireDate,
      label: label || `Pushya Nakshatra ${pushyaDate}`,
      isActive: true,
    };

    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        await pool.execute(
          `INSERT INTO PushyaDates (pushya_date, stage1_fire_date, stage2_fire_date, label, is_active)
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE stage1_fire_date = VALUES(stage1_fire_date), stage2_fire_date = VALUES(stage2_fire_date), label = VALUES(label), is_active = 1`,
          [entity.pushyaDate, entity.stage1FireDate, entity.stage2FireDate, entity.label || null]
        );
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL addPushyaDate error:', err.message);
      }
    }

    const idx = this.inMemoryPushyaDates.findIndex((p) => p.pushyaDate === pushyaDate);
    if (idx >= 0) {
      this.inMemoryPushyaDates[idx] = entity;
    } else {
      this.inMemoryPushyaDates.push(entity);
      this.inMemoryPushyaDates.sort((a, b) => a.pushyaDate.localeCompare(b.pushyaDate));
    }

    this.saveToDisk();
    return entity;
  }

  /**
   * Retrieves reminders filtered from MySQL or in-memory.
   */
  async findReminders(filter?: IReminderFilterQuery): Promise<IReminderEntity[]> {
    const pool = getSqlPool();

    if (isSqlConnected() && pool) {
      try {
        let query = `
          SELECT id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, sent_at, delivered_at, read_at, message_content
          FROM Reminders
          WHERE 1=1
        `;
        const params: any[] = [];

        if (filter?.pushyaDate) {
          query += ` AND pushya_date = ?`;
          params.push(filter.pushyaDate);
        }
        if (filter?.stage) {
          query += ` AND stage = ?`;
          params.push(filter.stage);
        }
        if (filter?.status) {
          query += ` AND status = ?`;
          params.push(filter.status);
        }
        if (filter?.patientId) {
          query += ` AND patient_id = ?`;
          params.push(filter.patientId);
        }

        query += ` ORDER BY scheduled_date ASC, patient_name ASC`;

        const [rows]: any = await pool.query(query, params);
        return rows.map((r: any) => ({
          id: r.id,
          patientId: r.patient_id,
          patientName: r.patient_name,
          phone: r.phone,
          pushyaDate: r.pushya_date,
          stage: r.stage as ReminderStage,
          scheduledDate: r.scheduled_date,
          status: r.status,
          sentAt: r.sent_at || undefined,
          deliveredAt: r.delivered_at || undefined,
          readAt: r.read_at || undefined,
          messageContent: r.message_content || undefined,
        }));
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL findReminders error:', err.message);
      }
    }

    let list = [...this.inMemoryReminders];
    if (filter?.pushyaDate) {
      list = list.filter((r) => r.pushyaDate === filter.pushyaDate);
    }
    if (filter?.stage) {
      list = list.filter((r) => r.stage === filter.stage);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    if (filter?.patientId) {
      list = list.filter((r) => r.patientId === filter.patientId);
    }
    return list;
  }

  /**
   * Retrieves single reminder by ID.
   */
  async findById(id: string): Promise<IReminderEntity | null> {
    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        const [rows]: any = await pool.query(
          `SELECT id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, sent_at, delivered_at, read_at, message_content
           FROM Reminders WHERE id = ?`,
          [id]
        );
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            patientId: r.patient_id,
            patientName: r.patient_name,
            phone: r.phone,
            pushyaDate: r.pushya_date,
            stage: r.stage as ReminderStage,
            scheduledDate: r.scheduled_date,
            status: r.status,
            sentAt: r.sent_at || undefined,
            deliveredAt: r.delivered_at || undefined,
            readAt: r.read_at || undefined,
            messageContent: r.message_content || undefined,
          };
        }
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL findById error:', err.message);
      }
    }

    return this.inMemoryReminders.find((r) => r.id === id) || null;
  }

  /**
   * Finds existing reminder for a patient on a specific pushyaDate and stage.
   */
  async findByPatientDateStage(
    patientId: string,
    pushyaDate: string,
    stage: ReminderStage
  ): Promise<IReminderEntity | null> {
    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        const [rows]: any = await pool.query(
          `SELECT id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, sent_at, delivered_at, read_at, message_content
           FROM Reminders WHERE patient_id = ? AND pushya_date = ? AND stage = ?`,
          [patientId, pushyaDate, stage]
        );
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            patientId: r.patient_id,
            patientName: r.patient_name,
            phone: r.phone,
            pushyaDate: r.pushya_date,
            stage: r.stage as ReminderStage,
            scheduledDate: r.scheduled_date,
            status: r.status,
            sentAt: r.sent_at || undefined,
            deliveredAt: r.delivered_at || undefined,
            readAt: r.read_at || undefined,
            messageContent: r.message_content || undefined,
          };
        }
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL findByPatientDateStage error:', err.message);
      }
    }

    return (
      this.inMemoryReminders.find(
        (r) => r.patientId === patientId && r.pushyaDate === pushyaDate && r.stage === stage
      ) || null
    );
  }

  /**
   * Creates a single reminder in MySQL or memory.
   */
  async createReminder(dto: CreateReminderRequestDto): Promise<IReminderEntity> {
    const id = `rem-${dto.patientId}-s${dto.stage}-${Date.now().toString().slice(-4)}`;

    const entity: IReminderEntity = {
      id,
      patientId: dto.patientId,
      patientName: dto.patientName,
      phone: dto.phone,
      pushyaDate: dto.pushyaDate,
      stage: dto.stage,
      scheduledDate: dto.scheduledDate,
      status: 'scheduled',
      messageContent: dto.messageContent,
    };

    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        await pool.execute(
          `INSERT INTO Reminders (id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, message_content)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            dto.patientId,
            dto.patientName,
            dto.phone,
            dto.pushyaDate,
            dto.stage,
            dto.scheduledDate,
            'scheduled',
            dto.messageContent || null,
          ]
        );
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL createReminder error:', err.message);
      }
    }

    this.inMemoryReminders.push(entity);
    this.saveToDisk();
    return entity;
  }

  /**
   * Updates status of a reminder in MySQL or memory.
   */
  async updateReminderStatus(id: string, dto: UpdateReminderStatusDto): Promise<IReminderEntity | null> {
    const pool = getSqlPool();

    const timestamp =
      dto.timestampStr ||
      new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    if (isSqlConnected() && pool) {
      try {
        let updateColumn = '';
        if (dto.status === 'sent') updateColumn = ', sent_at = ?';
        else if (dto.status === 'delivered') updateColumn = ', delivered_at = ?';
        else if (dto.status === 'read') updateColumn = ', read_at = ?';

        const params: any[] = [dto.status];
        if (updateColumn) params.push(timestamp);
        params.push(id);

        await pool.execute(`UPDATE Reminders SET status = ? ${updateColumn} WHERE id = ?`, params);

        await pool.execute(
          `INSERT INTO ReminderLogs (reminder_id, event_type, details) VALUES (?, ?, ?)`,
          [id, `WHATSAPP_STATUS_${dto.status.toUpperCase()}`, `Changed to ${dto.status} at ${timestamp}`]
        );
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL updateReminderStatus error:', err.message);
      }
    }

    const item = this.inMemoryReminders.find((r) => r.id === id);
    if (!item) return null;

    item.status = dto.status as any;
    if (dto.status === 'sent') item.sentAt = timestamp;
    else if (dto.status === 'delivered') item.deliveredAt = timestamp;
    else if (dto.status === 'read') item.readAt = timestamp;

    this.addLog(id, `WHATSAPP_STATUS_${dto.status.toUpperCase()}`, `Changed to ${dto.status} at ${timestamp}`);
    this.saveToDisk();
    return item;
  }

  /**
   * Adds an audit event log.
   */
  async addLog(reminderId: string, eventType: string, details?: string): Promise<void> {
    const eventTime = new Date().toISOString();
    const log: IWhatsAppLogEntity = {
      reminderId,
      eventType,
      status: eventType,
      details,
      eventTime,
    };

    const pool = getSqlPool();
    if (isSqlConnected() && pool) {
      try {
        await pool.execute(
          `INSERT INTO ReminderLogs (reminder_id, event_type, details) VALUES (?, ?, ?)`,
          [reminderId, eventType, details || null]
        );
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL addLog error:', err.message);
      }
    }

    this.inMemoryLogs.unshift(log);
    if (this.inMemoryLogs.length > 200) {
      this.inMemoryLogs = this.inMemoryLogs.slice(0, 200);
    }
    this.saveToDisk();
  }

  /**
   * Retrieves recent audit / WhatsApp dispatch logs.
   */
  async getLogs(filter?: { reminderId?: string; limit?: number }): Promise<IWhatsAppLogEntity[]> {
    const pool = getSqlPool();
    const limit = filter?.limit || 50;

    if (isSqlConnected() && pool) {
      try {
        let query = `
          SELECT rl.id, rl.reminder_id as reminderId, rl.event_type as eventType, rl.event_time as eventTime, rl.details,
                 r.patient_name as patientName, r.phone, r.pushya_date as pushyaDate, r.stage
          FROM ReminderLogs rl
          LEFT JOIN Reminders r ON rl.reminder_id = r.id
        `;
        const params: any[] = [];

        if (filter?.reminderId) {
          query += ` WHERE rl.reminder_id = ?`;
          params.push(filter.reminderId);
        }

        query += ` ORDER BY rl.id DESC LIMIT ?`;
        params.push(limit);

        const [rows]: any = await pool.query(query, params);
        return rows.map((r: any) => ({
          id: r.id,
          reminderId: r.reminderId,
          patientName: r.patientName,
          phone: r.phone,
          pushyaDate: r.pushyaDate,
          stage: r.stage,
          eventType: r.eventType,
          status: r.eventType,
          details: r.details,
          eventTime: r.eventTime ? new Date(r.eventTime).toISOString() : new Date().toISOString(),
        }));
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL getLogs error:', err.message);
      }
    }

    let logs = [...this.inMemoryLogs];
    if (filter?.reminderId) {
      logs = logs.filter((l) => l.reminderId === filter.reminderId);
    }
    return logs.slice(0, limit);
  }

  /**
   * Aggregates statistics from MySQL or memory.
   */
  async getStatistics(): Promise<IReminderStats> {
    const pool = getSqlPool();
    const pushyaList = await this.getPushyaDates();
    const upcomingDate = pushyaList[0]?.pushyaDate || '2026-07-18';

    if (isSqlConnected() && pool) {
      try {
        const [rows]: any = await pool.query(`
          SELECT 
            COALESCE(SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END), 0) as totalScheduled,
            COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) as totalSent,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as totalDelivered,
            COALESCE(SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END), 0) as totalRead,
            COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as totalFailed
          FROM Reminders
        `);

        const row = rows[0] || {};
        return {
          totalScheduled: Number(row.totalScheduled) || 0,
          totalSent: Number(row.totalSent) || 0,
          totalDelivered: Number(row.totalDelivered) || 0,
          totalRead: Number(row.totalRead) || 0,
          totalFailed: Number(row.totalFailed) || 0,
          upcomingPushyaDate: upcomingDate,
        };
      } catch (err: any) {
        console.warn('⚠️ [ReminderRepository] MySQL getStatistics error:', err.message);
      }
    }

    return {
      totalScheduled: this.inMemoryReminders.filter((r) => String(r.status) === 'scheduled').length,
      totalSent: this.inMemoryReminders.filter((r) => String(r.status) === 'sent').length,
      totalDelivered: this.inMemoryReminders.filter((r) => String(r.status) === 'delivered').length,
      totalRead: this.inMemoryReminders.filter((r) => String(r.status) === 'read').length,
      totalFailed: this.inMemoryReminders.filter((r) => String(r.status) === 'failed').length,
      upcomingPushyaDate: upcomingDate,
    };
  }
}
