export type ReminderStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
export type ReminderStage = 1 | 2;
export interface IPushyaDateEntity {
    id?: number;
    pushyaDate: string;
    stage1FireDate: string;
    stage2FireDate: string;
    label?: string;
    isActive: boolean;
}
export interface IReminderDbRow {
    id: string;
    patient_id: string;
    patient_name: string;
    phone: string;
    pushya_date: string;
    stage: number;
    scheduled_date: string;
    status: string;
    sent_at?: string | null;
    delivered_at?: string | null;
    read_at?: string | null;
    message_content?: string | null;
    created_at?: Date;
}
export interface IReminderEntity {
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
}
export interface IReminderStats {
    totalScheduled: number;
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    upcomingPushyaDate: string;
}
export interface IReminderFilterQuery {
    pushyaDate?: string;
    stage?: ReminderStage;
    status?: ReminderStatus;
    patientId?: string;
}
export interface IClinicInfo {
    clinicName: string;
    doctorName: string;
    doctorQualification: string;
    phone: string;
    address?: string;
    timings?: string;
}
export interface IWhatsAppMessageTemplate {
    stage: ReminderStage;
    title: string;
    description: string;
    timingDescription: string;
    template: string;
}
export interface IWhatsAppPreviewResult {
    patientId?: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    scheduledDate: string;
    messageContent: string;
    whatsAppUrl: string;
    characterCount: number;
}
export interface IWhatsAppSendResult {
    reminderId: string;
    patientId: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    status: ReminderStatus;
    sentAt: string;
    messageContent: string;
    whatsAppUrl: string;
    success: boolean;
    error?: string;
}
export interface IWhatsAppBatchDispatchResult {
    pushyaDate: string;
    stage: ReminderStage;
    scheduledDate: string;
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    dispatches: IWhatsAppSendResult[];
    dispatchedAt: string;
}
export interface IWhatsAppLogEntity {
    id?: number;
    reminderId: string;
    patientId?: string;
    patientName?: string;
    phone?: string;
    pushyaDate?: string;
    stage?: ReminderStage;
    eventType: string;
    status: string;
    details?: string;
    eventTime: string;
}
export interface IWhatsAppLogDbRow {
    id: number;
    reminder_id: string;
    event_type: string;
    event_time: Date | string;
    details?: string | null;
}
