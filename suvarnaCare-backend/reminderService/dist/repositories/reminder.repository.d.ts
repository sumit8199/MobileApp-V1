import { IReminderEntity, IReminderFilterQuery, IPushyaDateEntity, IReminderStats, IWhatsAppLogEntity, ReminderStage } from '../interfaces/reminder.backend.interface.js';
import { CreateReminderRequestDto, UpdateReminderStatusDto } from '../dtos/reminder.backend.dto.js';
export declare class ReminderRepository {
    private inMemoryPushyaDates;
    private inMemoryReminders;
    private inMemoryLogs;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    getPushyaDates(): Promise<IPushyaDateEntity[]>;
    addPushyaDate(pushyaDate: string, label?: string): Promise<IPushyaDateEntity>;
    findReminders(filter?: IReminderFilterQuery): Promise<IReminderEntity[]>;
    findById(id: string): Promise<IReminderEntity | null>;
    findByPatientDateStage(patientId: string, pushyaDate: string, stage: ReminderStage): Promise<IReminderEntity | null>;
    createReminder(dto: CreateReminderRequestDto): Promise<IReminderEntity>;
    updateReminderStatus(id: string, dto: UpdateReminderStatusDto): Promise<IReminderEntity | null>;
    addLog(reminderId: string, eventType: string, details?: string): Promise<void>;
    getLogs(filter?: {
        reminderId?: string;
        limit?: number;
    }): Promise<IWhatsAppLogEntity[]>;
    getStatistics(): Promise<IReminderStats>;
}
