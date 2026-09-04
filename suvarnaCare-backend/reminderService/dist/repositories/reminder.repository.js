import fs from 'fs';
import path from 'path';
import { getSqlPool, isSqlConnected } from '../database/sql-connection.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'reminders.db.json');
export class ReminderRepository {
    inMemoryPushyaDates = [];
    inMemoryReminders = [];
    inMemoryLogs = [];
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
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
        }
        catch { }
    }
    saveToDisk() {
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
        }
        catch { }
    }
    async getPushyaDates() {
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                const [rows] = await pool.query(`
          SELECT pushya_date, stage1_fire_date, stage2_fire_date, label, is_active
          FROM PushyaDates
          WHERE is_active = 1
          ORDER BY pushya_date ASC
        `);
                return rows.map((r) => ({
                    pushyaDate: r.pushya_date,
                    stage1FireDate: r.stage1_fire_date,
                    stage2FireDate: r.stage2_fire_date,
                    label: r.label,
                    isActive: Boolean(r.is_active),
                }));
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL getPushyaDates error:', err.message);
            }
        }
        return this.inMemoryPushyaDates.filter((p) => p.isActive);
    }
    async addPushyaDate(pushyaDate, label) {
        const parts = pushyaDate.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() - 3);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const stage1FireDate = `${yyyy}-${mm}-${dd}`;
        const stage2FireDate = pushyaDate;
        const entity = {
            pushyaDate,
            stage1FireDate,
            stage2FireDate,
            label: label || `Pushya Nakshatra ${pushyaDate}`,
            isActive: true,
        };
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                await pool.execute(`INSERT INTO PushyaDates (pushya_date, stage1_fire_date, stage2_fire_date, label, is_active)
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE stage1_fire_date = VALUES(stage1_fire_date), stage2_fire_date = VALUES(stage2_fire_date), label = VALUES(label), is_active = 1`, [entity.pushyaDate, entity.stage1FireDate, entity.stage2FireDate, entity.label || null]);
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL addPushyaDate error:', err.message);
            }
        }
        const idx = this.inMemoryPushyaDates.findIndex((p) => p.pushyaDate === pushyaDate);
        if (idx >= 0) {
            this.inMemoryPushyaDates[idx] = entity;
        }
        else {
            this.inMemoryPushyaDates.push(entity);
            this.inMemoryPushyaDates.sort((a, b) => a.pushyaDate.localeCompare(b.pushyaDate));
        }
        this.saveToDisk();
        return entity;
    }
    async updatePushyaDate(oldDate, newDate, label) {
        const parts = newDate.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() - 3);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const stage1FireDate = `${yyyy}-${mm}-${dd}`;
        const stage2FireDate = newDate;
        const existing = this.inMemoryPushyaDates.find((p) => p.pushyaDate === oldDate);
        const resolvedLabel = label || existing?.label || `Pushya Nakshatra ${newDate}`;
        const entity = {
            pushyaDate: newDate,
            stage1FireDate,
            stage2FireDate,
            label: resolvedLabel,
            isActive: true,
        };
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                if (oldDate === newDate) {
                    await pool.execute(`UPDATE PushyaDates SET stage1_fire_date = ?, stage2_fire_date = ?, label = ?, is_active = 1 WHERE pushya_date = ?`, [stage1FireDate, stage2FireDate, resolvedLabel, oldDate]);
                }
                else {
                    const [exists] = await pool.query(`SELECT pushya_date FROM PushyaDates WHERE pushya_date = ?`, [newDate]);
                    if (exists && exists.length > 0) {
                        await pool.execute(`DELETE FROM PushyaDates WHERE pushya_date = ?`, [oldDate]);
                    }
                    else {
                        await pool.execute(`UPDATE PushyaDates SET pushya_date = ?, stage1_fire_date = ?, stage2_fire_date = ?, label = ?, is_active = 1 WHERE pushya_date = ?`, [newDate, stage1FireDate, stage2FireDate, resolvedLabel, oldDate]);
                    }
                    await pool.execute(`UPDATE Reminders SET pushya_date = ?, scheduled_date = CASE WHEN stage = 1 THEN ? ELSE ? END WHERE pushya_date = ?`, [newDate, stage1FireDate, stage2FireDate, oldDate]);
                }
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL updatePushyaDate error:', err.message);
            }
        }
        if (oldDate === newDate) {
            const idx = this.inMemoryPushyaDates.findIndex((p) => p.pushyaDate === oldDate);
            if (idx >= 0) {
                this.inMemoryPushyaDates[idx] = entity;
            }
            else {
                this.inMemoryPushyaDates.push(entity);
            }
        }
        else {
            this.inMemoryPushyaDates = this.inMemoryPushyaDates.filter((p) => p.pushyaDate !== oldDate && p.pushyaDate !== newDate);
            this.inMemoryPushyaDates.push(entity);
            this.inMemoryPushyaDates.sort((a, b) => a.pushyaDate.localeCompare(b.pushyaDate));
            this.inMemoryReminders.forEach((r) => {
                if (r.pushyaDate === oldDate) {
                    r.pushyaDate = newDate;
                    r.scheduledDate = r.stage === 1 ? stage1FireDate : stage2FireDate;
                }
            });
        }
        this.saveToDisk();
        return entity;
    }
    async deletePushyaDate(pushyaDate) {
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                await pool.execute(`DELETE FROM Reminders WHERE pushya_date = ?`, [pushyaDate]);
                const [res] = await pool.execute(`DELETE FROM PushyaDates WHERE pushya_date = ?`, [pushyaDate]);
                console.log(`🗑️ [ReminderRepository] Deleted Pushya date ${pushyaDate} from MySQL`);
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL deletePushyaDate error:', err.message);
            }
        }
        this.inMemoryPushyaDates = this.inMemoryPushyaDates.filter((p) => p.pushyaDate !== pushyaDate);
        this.inMemoryReminders = this.inMemoryReminders.filter((r) => r.pushyaDate !== pushyaDate);
        this.saveToDisk();
        return true;
    }
    async findReminders(filter) {
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                let query = `
          SELECT id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, sent_at, delivered_at, read_at, message_content
          FROM Reminders
          WHERE 1=1
        `;
                const params = [];
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
                const [rows] = await pool.query(query, params);
                return rows.map((r) => ({
                    id: r.id,
                    patientId: r.patient_id,
                    patientName: r.patient_name,
                    phone: r.phone,
                    pushyaDate: r.pushya_date,
                    stage: r.stage,
                    scheduledDate: r.scheduled_date,
                    status: r.status,
                    sentAt: r.sent_at || undefined,
                    deliveredAt: r.delivered_at || undefined,
                    readAt: r.read_at || undefined,
                    messageContent: r.message_content || undefined,
                }));
            }
            catch (err) {
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
    async findById(id) {
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                const [rows] = await pool.query(`SELECT id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, sent_at, delivered_at, read_at, message_content
           FROM Reminders WHERE id = ?`, [id]);
                if (rows && rows.length > 0) {
                    const r = rows[0];
                    return {
                        id: r.id,
                        patientId: r.patient_id,
                        patientName: r.patient_name,
                        phone: r.phone,
                        pushyaDate: r.pushya_date,
                        stage: r.stage,
                        scheduledDate: r.scheduled_date,
                        status: r.status,
                        sentAt: r.sent_at || undefined,
                        deliveredAt: r.delivered_at || undefined,
                        readAt: r.read_at || undefined,
                        messageContent: r.message_content || undefined,
                    };
                }
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL findById error:', err.message);
            }
        }
        return this.inMemoryReminders.find((r) => r.id === id) || null;
    }
    async findByPatientDateStage(patientId, pushyaDate, stage) {
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                const [rows] = await pool.query(`SELECT id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, sent_at, delivered_at, read_at, message_content
           FROM Reminders WHERE patient_id = ? AND pushya_date = ? AND stage = ?`, [patientId, pushyaDate, stage]);
                if (rows && rows.length > 0) {
                    const r = rows[0];
                    return {
                        id: r.id,
                        patientId: r.patient_id,
                        patientName: r.patient_name,
                        phone: r.phone,
                        pushyaDate: r.pushya_date,
                        stage: r.stage,
                        scheduledDate: r.scheduled_date,
                        status: r.status,
                        sentAt: r.sent_at || undefined,
                        deliveredAt: r.delivered_at || undefined,
                        readAt: r.read_at || undefined,
                        messageContent: r.message_content || undefined,
                    };
                }
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL findByPatientDateStage error:', err.message);
            }
        }
        return (this.inMemoryReminders.find((r) => r.patientId === patientId && r.pushyaDate === pushyaDate && r.stage === stage) || null);
    }
    async createReminder(dto) {
        const id = `rem-${dto.patientId}-s${dto.stage}-${Date.now().toString().slice(-4)}`;
        const entity = {
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
                await pool.execute(`INSERT INTO Reminders (id, patient_id, patient_name, phone, pushya_date, stage, scheduled_date, status, message_content)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    id,
                    dto.patientId,
                    dto.patientName,
                    dto.phone,
                    dto.pushyaDate,
                    dto.stage,
                    dto.scheduledDate,
                    'scheduled',
                    dto.messageContent || null,
                ]);
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL createReminder error:', err.message);
            }
        }
        this.inMemoryReminders.push(entity);
        this.saveToDisk();
        return entity;
    }
    async updateReminderStatus(id, dto) {
        const pool = getSqlPool();
        const timestamp = dto.timestampStr ||
            new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        if (isSqlConnected() && pool) {
            try {
                let updateColumn = '';
                if (dto.status === 'sent')
                    updateColumn = ', sent_at = ?';
                else if (dto.status === 'delivered')
                    updateColumn = ', delivered_at = ?';
                else if (dto.status === 'read')
                    updateColumn = ', read_at = ?';
                const params = [dto.status];
                if (updateColumn)
                    params.push(timestamp);
                params.push(id);
                await pool.execute(`UPDATE Reminders SET status = ? ${updateColumn} WHERE id = ?`, params);
                await pool.execute(`INSERT INTO ReminderLogs (reminder_id, event_type, details) VALUES (?, ?, ?)`, [id, `WHATSAPP_STATUS_${dto.status.toUpperCase()}`, `Changed to ${dto.status} at ${timestamp}`]);
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL updateReminderStatus error:', err.message);
            }
        }
        const item = this.inMemoryReminders.find((r) => r.id === id);
        if (!item)
            return null;
        item.status = dto.status;
        if (dto.status === 'sent')
            item.sentAt = timestamp;
        else if (dto.status === 'delivered')
            item.deliveredAt = timestamp;
        else if (dto.status === 'read')
            item.readAt = timestamp;
        this.addLog(id, `WHATSAPP_STATUS_${dto.status.toUpperCase()}`, `Changed to ${dto.status} at ${timestamp}`);
        this.saveToDisk();
        return item;
    }
    async addLog(reminderId, eventType, details) {
        const eventTime = new Date().toISOString();
        const log = {
            reminderId,
            eventType,
            status: eventType,
            details,
            eventTime,
        };
        const pool = getSqlPool();
        if (isSqlConnected() && pool) {
            try {
                await pool.execute(`INSERT INTO ReminderLogs (reminder_id, event_type, details) VALUES (?, ?, ?)`, [reminderId, eventType, details || null]);
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL addLog error:', err.message);
            }
        }
        this.inMemoryLogs.unshift(log);
        if (this.inMemoryLogs.length > 200) {
            this.inMemoryLogs = this.inMemoryLogs.slice(0, 200);
        }
        this.saveToDisk();
    }
    async getLogs(filter) {
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
                const params = [];
                if (filter?.reminderId) {
                    query += ` WHERE rl.reminder_id = ?`;
                    params.push(filter.reminderId);
                }
                query += ` ORDER BY rl.id DESC LIMIT ?`;
                params.push(limit);
                const [rows] = await pool.query(query, params);
                return rows.map((r) => ({
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
            }
            catch (err) {
                console.warn('⚠️ [ReminderRepository] MySQL getLogs error:', err.message);
            }
        }
        let logs = [...this.inMemoryLogs];
        if (filter?.reminderId) {
            logs = logs.filter((l) => l.reminderId === filter.reminderId);
        }
        return logs.slice(0, limit);
    }
    async getStatistics() {
        const pool = getSqlPool();
        const todayMs = new Date().setHours(0, 0, 0, 0);
        const sorted = [...pushyaList].sort((a, b) => new Date(a.pushyaDate).getTime() - new Date(b.pushyaDate).getTime());
        const upcomingDate = sorted.find((d) => new Date(d.pushyaDate).getTime() >= todayMs)?.pushyaDate || sorted[sorted.length - 1]?.pushyaDate || '2026-09-10';
        if (isSqlConnected() && pool) {
            try {
                const [rows] = await pool.query(`
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
            }
            catch (err) {
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
//# sourceMappingURL=reminder.repository.js.map