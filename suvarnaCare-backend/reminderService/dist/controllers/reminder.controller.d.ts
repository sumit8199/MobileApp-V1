import { Request, Response } from 'express';
import { ReminderService } from '../services/reminder.service.js';
import { SchedulerService } from '../services/scheduler.service.js';
export declare class ReminderController {
    private service;
    private scheduler;
    constructor(service?: ReminderService, scheduler?: SchedulerService);
    getPushyaDates: (_req: Request, res: Response) => Promise<void>;
    getUpcomingPushya: (_req: Request, res: Response) => Promise<void>;
    addPushyaDate: (req: Request, res: Response) => Promise<void>;
    updatePushyaDate: (req: Request, res: Response) => Promise<void>;
    deletePushyaDate: (req: Request, res: Response) => Promise<void>;
    getReminders: (req: Request, res: Response) => Promise<void>;
    createReminder: (req: Request, res: Response) => Promise<void>;
    updateStatus: (req: Request, res: Response) => Promise<void>;
    getStatistics: (_req: Request, res: Response) => Promise<void>;
    getWhatsAppTemplates: (_req: Request, res: Response) => Promise<void>;
    previewWhatsApp: (req: Request, res: Response) => Promise<void>;
    sendSingleWhatsApp: (req: Request, res: Response) => Promise<void>;
    sendBulkWhatsApp: (req: Request, res: Response) => Promise<void>;
    triggerTodayWhatsApp: (req: Request, res: Response) => Promise<void>;
    getWhatsAppLogs: (req: Request, res: Response) => Promise<void>;
    syncPatients: (req: Request, res: Response) => Promise<void>;
    getSchedulerStatus: (_req: Request, res: Response) => Promise<void>;
    triggerScheduler: (req: Request, res: Response) => Promise<void>;
    verifyWhatsAppWebhook: (req: Request, res: Response) => void;
    handleWhatsAppWebhook: (req: Request, res: Response) => Promise<void>;
    healthCheck: (_req: Request, res: Response) => Promise<void>;
}
