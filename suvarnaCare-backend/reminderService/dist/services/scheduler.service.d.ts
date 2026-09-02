import { ReminderService } from './reminder.service.js';
import { IWhatsAppBatchDispatchResult } from '../interfaces/reminder.backend.interface.js';
export declare class SchedulerService {
    private timer;
    private isRunning;
    private intervalMs;
    private reminderService;
    constructor(reminderService: ReminderService, intervalMs?: number);
    start(): void;
    stop(): void;
    evaluateSchedules(targetDateStr?: string): Promise<{
        dateEvaluated: string;
        stage1Dispatches: IWhatsAppBatchDispatchResult[];
        stage2Dispatches: IWhatsAppBatchDispatchResult[];
        messagesSent: number;
    }>;
    private getTodayDateString;
    getStatus(): {
        isRunning: boolean;
        intervalMs: number;
    };
}
