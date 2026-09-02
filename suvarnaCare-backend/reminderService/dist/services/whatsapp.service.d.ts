import { ReminderStage, IClinicInfo, IWhatsAppMessageTemplate, IWhatsAppPreviewResult, IWhatsAppSendResult } from '../interfaces/reminder.backend.interface.js';
export declare class WhatsAppService {
    private defaultClinicInfo;
    getTemplates(): IWhatsAppMessageTemplate[];
    formatPushyaDate(dateStr: string): string;
    generateMessage(stage: ReminderStage, patientName: string, pushyaDate: string, clinicInfo?: Partial<IClinicInfo>): string;
    generateWhatsAppLink(phone: string, message: string): string;
    previewMessage(options: {
        patientId?: string;
        patientName: string;
        phone: string;
        pushyaDate: string;
        stage: ReminderStage;
        scheduledDate?: string;
        clinicInfo?: Partial<IClinicInfo>;
    }): IWhatsAppPreviewResult;
    sendWhatsApp(params: {
        reminderId: string;
        patientId: string;
        patientName: string;
        phone: string;
        pushyaDate: string;
        stage: ReminderStage;
        messageContent?: string;
        simulateDelivery?: boolean;
        clinicInfo?: Partial<IClinicInfo>;
    }): Promise<IWhatsAppSendResult>;
    calculateOffsetDate(dateStr: string, offsetDays: number): string;
}
