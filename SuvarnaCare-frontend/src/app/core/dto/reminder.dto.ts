import { ReminderStage, ReminderStatus } from '../interfaces/reminder.interface';

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

export interface SyncPatientsRequestDto {
  pushyaDate: string;
  patients: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
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
}

export interface ReminderStatsDto {
  totalScheduled: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  upcomingPushyaDate: string;
}
