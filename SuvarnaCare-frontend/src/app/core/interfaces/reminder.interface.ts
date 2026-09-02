export type ReminderStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
export type ReminderStage = 1 | 2;

export interface Reminder {
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

export interface PushyaSchedule {
  pushyaDate: string;
  stage1FireDate: string;
  stage2FireDate: string;
  label?: string;
  isActive: boolean;
  daysToPushya?: number;
  daysToStage1?: number;
}

export interface ReminderStats {
  totalScheduled: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  upcomingPushyaDate: string;
}

export interface WhatsAppPreview {
  patientName: string;
  phone: string;
  pushyaDate: string;
  stage: ReminderStage;
  scheduledDate: string;
  messageContent: string;
  whatsAppUrl: string;
  characterCount: number;
}

export interface WhatsAppTemplate {
  stage: ReminderStage;
  title: string;
  description: string;
  timingDescription: string;
  template: string;
}
