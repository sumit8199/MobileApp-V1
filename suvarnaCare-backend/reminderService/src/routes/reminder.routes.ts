import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller.js';

const router = Router();
const controller = new ReminderController();

// Health Check
router.get('/health/db', controller.healthCheck);

// Pushya Calendar Dates
router.get('/pushya-dates', controller.getPushyaDates);
router.get('/pushya-dates/upcoming', controller.getUpcomingPushya);
router.post('/pushya-dates', controller.addPushyaDate);

// Dashboard Statistics
router.get('/statistics', controller.getStatistics);

// WhatsApp Messaging Endpoints
router.get('/whatsapp/templates', controller.getWhatsAppTemplates);
router.post('/whatsapp/preview', controller.previewWhatsApp);
router.post('/whatsapp/send-single', controller.sendSingleWhatsApp);
router.post('/whatsapp/send-bulk', controller.sendBulkWhatsApp);
router.post('/whatsapp/trigger-today', controller.triggerTodayWhatsApp);
router.get('/whatsapp/logs', controller.getWhatsAppLogs);

// Reminders CRUD & Status
router.get('/', controller.getReminders);
router.post('/', controller.createReminder);
router.put('/:id/status', controller.updateStatus);

// Sync reminders from patient roster
router.post('/sync-patients', controller.syncPatients);

export default router;
