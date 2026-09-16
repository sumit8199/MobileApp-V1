import { ReminderService } from './reminder.service.js';
import { IWhatsAppBatchDispatchResult } from '../interfaces/reminder.backend.interface.js';
export interface ISchedulerStatus {
    isRunning: boolean;
    dispatchTime: string;
    dispatchHour: number;
    dispatchMinute: number;
    cronExpression: string;
    timezone: string;
    lastRunAt: string | null;
    lastDispatchedDate: string | null;
    lastRunStatus: string;
    currentTimeInZone: string;
}
export declare class SchedulerService {
    private task;
    private isRunning;
    private reminderService;
    private dispatchHour;
    private dispatchMinute;
    private cronExpression;
    private timezone;
    private lastRunAt;
    private lastDispatchedDate;
    private lastRunStatus;
    constructor(reminderService: ReminderService, cronExpression?: string);
    start(): void;
    stop(): void;
    evaluateSchedules(targetDateStr?: string, forceDispatch?: boolean): Promise<{
        dateEvaluated: string;
        stage1Dispatches: IWhatsAppBatchDispatchResult[];
        stage2Dispatches: IWhatsAppBatchDispatchResult[];
        messagesSent: number;
        dispatched: boolean;
        reason?: string;
    }>;
    getTodayDateString(): string;
    getCurrentDateTimeInTimezone(): string;
    getFormattedDispatchTime(): string;
    getStatus(): ISchedulerStatus;
}
export declare function getSchedulerService(reminderService?: ReminderService): SchedulerService;
