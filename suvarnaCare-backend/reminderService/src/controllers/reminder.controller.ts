import { Request, Response } from 'express';
import { ReminderService } from '../services/reminder.service.js';
import { buildApiResponse } from '../dtos/reminder.backend.dto.js';
import { isSqlConnected } from '../database/sql-connection.js';

export class ReminderController {
  private service: ReminderService;

  constructor(service = new ReminderService()) {
    this.service = service;
  }

  /**
   * GET /api/reminders/pushya-dates
   */
  getPushyaDates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const dates = await this.service.getPushyaDates();
      res.status(200).json(buildApiResponse(dates, 'Pushya calendar dates retrieved.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
    }
  };

  /**
   * GET /api/reminders/pushya-dates/upcoming
   */
  getUpcomingPushya = async (_req: Request, res: Response): Promise<void> => {
    try {
      const upcoming = await this.service.getUpcomingPushyaInfo();
      res.status(200).json(buildApiResponse(upcoming, 'Upcoming Pushya Nakshatra session retrieved.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders/pushya-dates
   */
  addPushyaDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pushyaDate, label } = req.body;
      if (!pushyaDate) {
        res.status(400).json(buildApiResponse(null, 'Validation Error: pushyaDate is required (YYYY-MM-DD).', false, isSqlConnected()));
        return;
      }
      const created = await this.service.addPushyaDate(pushyaDate, label);
      res.status(201).json(buildApiResponse(created, 'Pushya date added successfully with Stage 1 (3 days before) calculation.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * PUT /api/reminders/pushya-dates/:oldDate
   * or PUT /api/reminders/pushya-dates
   */
  updatePushyaDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const oldDate = (req.params.oldDate || req.params.date || req.body?.oldDate || req.body?.pushyaDate) as string;
      const newDate = (req.body?.newDate || req.body?.pushyaDate) as string;
      const label = req.body?.label as string | undefined;

      if (!oldDate || !newDate) {
        res.status(400).json(buildApiResponse(null, 'Validation Error: Both oldDate and newDate are required.', false, isSqlConnected()));
        return;
      }

      const updated = await this.service.updatePushyaDate(oldDate, newDate, label);
      res.status(200).json(buildApiResponse(updated, `Pushya date updated from ${oldDate} to ${newDate} successfully.`, true, isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * DELETE /api/reminders/pushya-dates/:date
   */
  deletePushyaDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const dateParam = (req.params.date || req.params.pushyaDate || req.body?.pushyaDate) as string;
      if (!dateParam) {
        res.status(400).json(buildApiResponse(false, 'Validation Error: pushyaDate parameter is required.', false, isSqlConnected()));
        return;
      }
      await this.service.deletePushyaDate(dateParam);
      res.status(200).json(buildApiResponse(true, `Pushya date ${dateParam} deleted successfully from database.`, true, isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse(false, error.message, false, isSqlConnected()));
    }
  };

  /**
   * GET /api/reminders
   */
  getReminders = async (req: Request, res: Response): Promise<void> => {
    try {
      const pushyaDate = req.query.pushyaDate as string | undefined;
      const stage = req.query.stage ? (parseInt(req.query.stage as string, 10) as 1 | 2) : undefined;
      const status = req.query.status as any;
      const patientId = req.query.patientId as string | undefined;

      const reminders = await this.service.getReminders({ pushyaDate, stage, status, patientId });
      res.status(200).json(
        buildApiResponse(reminders, `Retrieved ${reminders.length} reminders.`, true, isSqlConnected())
      );
    } catch (error: any) {
      res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders
   */
  createReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await this.service.createReminder(req.body);
      res.status(201).json(buildApiResponse(created, 'Reminder created successfully.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * PUT /api/reminders/:id/status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await this.service.updateStatus(id, req.body);
      if (!updated) {
        res.status(404).json(buildApiResponse(null, `Reminder with ID ${id} not found.`, false, isSqlConnected()));
        return;
      }
      res.status(200).json(buildApiResponse(updated, 'Reminder status updated.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * GET /api/reminders/statistics
   */
  getStatistics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStatistics();
      res.status(200).json(buildApiResponse(stats, 'Reminder statistics retrieved.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * GET /api/reminders/whatsapp/templates
   */
  getWhatsAppTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const templates = this.service.getWhatsAppTemplates();
      res.status(200).json(buildApiResponse(templates, 'WhatsApp reminder templates retrieved.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders/whatsapp/preview
   */
  previewWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
      const preview = this.service.previewWhatsAppMessage(req.body);
      res.status(200).json(buildApiResponse(preview, 'WhatsApp reminder preview generated.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders/whatsapp/send-single
   */
  sendSingleWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.sendSingleWhatsAppReminder(req.body);
      res.status(200).json(buildApiResponse(result, 'WhatsApp message processed.', true, isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders/whatsapp/send-bulk
   */
  sendBulkWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.sendBulkWhatsAppReminders(req.body);
      res.status(200).json(
        buildApiResponse(
          result,
          `Bulk WhatsApp dispatch completed. ${result.successCount} sent, ${result.failedCount} failed.`,
          true,
          isSqlConnected()
        )
      );
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders/whatsapp/trigger-today
   */
  triggerTodayWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.triggerTodayReminders(req.body);
      res.status(200).json(
        buildApiResponse(
          result,
          `Evaluated Pushya schedules for date ${result.evaluatedDate}. Total WhatsApp alerts dispatched: ${result.totalMessagesSent}.`,
          true,
          isSqlConnected()
        )
      );
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * GET /api/reminders/whatsapp/logs
   */
  getWhatsAppLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const reminderId = req.query.reminderId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await this.service.getWhatsAppLogs({ reminderId, limit });
      res.status(200).json(buildApiResponse(logs, `Retrieved ${logs.length} WhatsApp audit logs.`, true, isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse([], error.message, false, isSqlConnected()));
    }
  };

  /**
   * POST /api/reminders/sync-patients
   */
  syncPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.syncPatientsForPushya(req.body);
      res.status(200).json(
        buildApiResponse(
          result,
          `Successfully synced ${result.createdCount} reminders for Pushya session ${result.pushyaDate}.`,
          true,
          isSqlConnected()
        )
      );
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, false, isSqlConnected()));
    }
  };

  /**
   * GET /api/reminders/health/db
   */
  healthCheck = async (_req: Request, res: Response): Promise<void> => {
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
