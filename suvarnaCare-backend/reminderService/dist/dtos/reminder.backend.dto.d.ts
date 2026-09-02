import { IReminderEntity, IReminderDbRow, IPushyaDateEntity, ReminderStatus, ReminderStage, IClinicInfo } from '../interfaces/reminder.backend.interface.js';
export interface CreateReminderRequestDto {
    patientId: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    scheduledDate: string;
    messageContent?: string;
}
export interface UpdateReminderStatusDto {
    status: ReminderStatus;
    timestampStr?: string;
}
export interface SyncPatientsDto {
    pushyaDate: string;
    patients: Array<{
        id: string;
        name: string;
        phone: string;
        parentName?: string;
    }>;
}
export interface SendWhatsAppRequestDto {
    reminderId?: string;
    patientId: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    customMessage?: string;
    simulateDelivery?: boolean;
}
export interface SendBulkWhatsAppRequestDto {
    pushyaDate: string;
    stage: ReminderStage;
    patientIds?: string[];
    simulateDelivery?: boolean;
}
export interface WhatsAppPreviewRequestDto {
    patientName?: string;
    phone?: string;
    pushyaDate?: string;
    stage?: ReminderStage;
    clinicInfo?: Partial<IClinicInfo>;
}
export interface TriggerTodayRemindersRequestDto {
    targetDate?: string;
    simulateDelivery?: boolean;
}
export interface ReminderResponseDto {
    id: string;
    patientId: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    scheduledDate: string;
    status: ReminderStatus;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    messageContent?: string;
    whatsAppUrl?: string;
}
export interface PushyaScheduleResponseDto {
    pushyaDate: string;
    stage1FireDate: string;
    stage2FireDate: string;
    label?: string;
    isActive: boolean;
    daysToPushya?: number;
    daysToStage1?: number;
}
export interface ApiResponseDto<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
    databaseConnected: boolean;
}
export declare function buildCreateReminderDto(input: any): CreateReminderRequestDto;
export declare function buildUpdateReminderStatusDto(input: any): UpdateReminderStatusDto;
export declare function buildSendWhatsAppDto(input: any): SendWhatsAppRequestDto;
export declare function buildSendBulkWhatsAppDto(input: any): SendBulkWhatsAppRequestDto;
export declare function buildWhatsAppPreviewDto(input: any): WhatsAppPreviewRequestDto;
export declare function buildTriggerTodayRemindersDto(input: any): TriggerTodayRemindersRequestDto;
export declare function toReminderResponseDto(row: IReminderDbRow | IReminderEntity): ReminderResponseDto;
export declare function toReminderListResponseDto(rows: Array<IReminderDbRow | IReminderEntity>): ReminderResponseDto[];
export declare function toPushyaScheduleDto(entity: IPushyaDateEntity): PushyaScheduleResponseDto;
export declare function buildApiResponse<T>(data: T, message?: string, success?: boolean, isDbConnected?: boolean): ApiResponseDto<T>;
