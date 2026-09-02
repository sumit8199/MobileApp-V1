import { ReminderService } from '../services/reminder.service.js';
import { buildApiResponse } from '../dtos/reminder.backend.dto.js';
import { isSqlConnected } from '../database/sql-connection.js';
export class ReminderController {
    service;
    constructor(service = new ReminderService()) {
        this.service = service;
    }
    getPushyaDates = async (_req, res) => {
        try {
            const dates = await this.service.getPushyaDates();
            res.status(200).json(buildApiResponse(dates, 'Pushya calendar dates retrieved.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
        }
    };
    getUpcomingPushya = async (_req, res) => {
        try {
            const upcoming = await this.service.getUpcomingPushyaInfo();
            res.status(200).json(buildApiResponse(upcoming, 'Upcoming Pushya Nakshatra session retrieved.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(500).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    addPushyaDate = async (req, res) => {
        try {
            const { pushyaDate, label } = req.body;
            if (!pushyaDate) {
                res.status(400).json(buildApiResponse(null, 'Validation Error: pushyaDate is required (YYYY-MM-DD).', false, isSqlConnected()));
                return;
            }
            const created = await this.service.addPushyaDate(pushyaDate, label);
            res.status(201).json(buildApiResponse(created, 'Pushya date added successfully with Stage 1 (3 days before) calculation.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    getReminders = async (req, res) => {
        try {
            const pushyaDate = req.query.pushyaDate;
            const stage = req.query.stage ? parseInt(req.query.stage, 10) : undefined;
            const status = req.query.status;
            const patientId = req.query.patientId;
            const reminders = await this.service.getReminders({ pushyaDate, stage, status, patientId });
            res.status(200).json(buildApiResponse(reminders, `Retrieved ${reminders.length} reminders.`, true, isSqlConnected()));
        }
        catch (error) {
            res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
        }
    };
    createReminder = async (req, res) => {
        try {
            const created = await this.service.createReminder(req.body);
            res.status(201).json(buildApiResponse(created, 'Reminder created successfully.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    updateStatus = async (req, res) => {
        try {
            const id = String(req.params.id);
            const updated = await this.service.updateStatus(id, req.body);
            if (!updated) {
                res.status(404).json(buildApiResponse(null, `Reminder with ID ${id} not found.`, false, isSqlConnected()));
                return;
            }
            res.status(200).json(buildApiResponse(updated, 'Reminder status updated.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    getStatistics = async (_req, res) => {
        try {
            const stats = await this.service.getStatistics();
            res.status(200).json(buildApiResponse(stats, 'Reminder statistics retrieved.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(500).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    getWhatsAppTemplates = async (_req, res) => {
        try {
            const templates = this.service.getWhatsAppTemplates();
            res.status(200).json(buildApiResponse(templates, 'WhatsApp reminder templates retrieved.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
        }
    };
    previewWhatsApp = async (req, res) => {
        try {
            const preview = this.service.previewWhatsAppMessage(req.body);
            res.status(200).json(buildApiResponse(preview, 'WhatsApp reminder preview generated.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    sendSingleWhatsApp = async (req, res) => {
        try {
            const result = await this.service.sendSingleWhatsAppReminder(req.body);
            res.status(200).json(buildApiResponse(result, 'WhatsApp message processed.', true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    sendBulkWhatsApp = async (req, res) => {
        try {
            const result = await this.service.sendBulkWhatsAppReminders(req.body);
            res.status(200).json(buildApiResponse(result, `Bulk WhatsApp dispatch completed. ${result.successCount} sent, ${result.failedCount} failed.`, true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    triggerTodayWhatsApp = async (req, res) => {
        try {
            const result = await this.service.triggerTodayReminders(req.body);
            res.status(200).json(buildApiResponse(result, `Evaluated Pushya schedules for date ${result.evaluatedDate}. Total WhatsApp alerts dispatched: ${result.totalMessagesSent}.`, true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    getWhatsAppLogs = async (req, res) => {
        try {
            const reminderId = req.query.reminderId;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const logs = await this.service.getWhatsAppLogs({ reminderId, limit });
            res.status(200).json(buildApiResponse(logs, `Retrieved ${logs.length} WhatsApp audit logs.`, true, isSqlConnected()));
        }
        catch (error) {
            res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
        }
    };
    syncPatients = async (req, res) => {
        try {
            const result = await this.service.syncPatientsForPushya(req.body);
            res.status(200).json(buildApiResponse(result, `Successfully synced ${result.createdCount} reminders for Pushya session ${result.pushyaDate}.`, true, isSqlConnected()));
        }
        catch (error) {
            res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
        }
    };
    healthCheck = async (_req, res) => {
        const connected = isSqlConnected();
        res.status(200).json({
            service: 'ReminderService',
            status: 'UP',
            whatsAppService: 'Active',
            database: 'MySQL',
            databaseConnected: connected,
            timestamp: new Date().toISOString(),
        });
    };
}
//# sourceMappingURL=reminder.controller.js.map