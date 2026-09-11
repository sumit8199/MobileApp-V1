import { ReminderRepository } from '../repositories/reminder.repository.js';
import { WhatsAppService } from './whatsapp.service.js';
import { SyncPatientsDto, ReminderResponseDto, PushyaScheduleResponseDto } from '../dtos/reminder.backend.dto.js';
import { IReminderFilterQuery, IReminderStats, IWhatsAppPreviewResult, IWhatsAppSendResult, IWhatsAppBatchDispatchResult, IWhatsAppMessageTemplate, IWhatsAppLogEntity } from '../interfaces/reminder.backend.interface.js';
export declare class ReminderService {
    private repository;
    private whatsAppService;
    constructor(repository?: ReminderRepository, whatsAppService?: WhatsAppService);
    getPushyaDates(): Promise<PushyaScheduleResponseDto[]>;
    getUpcomingPushyaInfo(): Promise<PushyaScheduleResponseDto | null>;
    addPushyaDate(pushyaDate: string, label?: string): Promise<PushyaScheduleResponseDto>;
    updatePushyaDate(oldDate: string, newDate: string, label?: string): Promise<PushyaScheduleResponseDto>;
    deletePushyaDate(pushyaDate: string): Promise<boolean>;
    getReminders(filter?: IReminderFilterQuery): Promise<ReminderResponseDto[]>;
    createReminder(rawInput: any): Promise<ReminderResponseDto>;
    updateStatus(id: string, rawInput: any): Promise<ReminderResponseDto | null>;
    getStatistics(): Promise<IReminderStats>;
    getWhatsAppTemplates(): IWhatsAppMessageTemplate[];
    previewWhatsAppMessage(rawInput: any): IWhatsAppPreviewResult;
    sendSingleWhatsAppReminder(rawInput: any): Promise<IWhatsAppSendResult>;
    sendBulkWhatsAppReminders(rawInput: any): Promise<IWhatsAppBatchDispatchResult>;
    triggerTodayReminders(rawInput: any): Promise<{
        evaluatedDate: string;
        stage1Results: IWhatsAppBatchDispatchResult[];
        stage2Results: IWhatsAppBatchDispatchResult[];
        totalMessagesSent: number;
    }>;
    getWhatsAppLogs(filter?: {
        reminderId?: string;
        limit?: number;
    }): Promise<IWhatsAppLogEntity[]>;
    syncPatientsForPushya(dto: SyncPatientsDto): Promise<{
        createdCount: number;
        pushyaDate: string;
    }>;
    private getTodayDateString;
}
