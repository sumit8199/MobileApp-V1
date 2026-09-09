import { ReminderRepository } from '../repositories/reminder.repository.js';
import { WhatsAppService } from './whatsapp.service.js';
import {
  CreateReminderRequestDto,
  UpdateReminderStatusDto,
  SyncPatientsDto,
  SendWhatsAppRequestDto,
  SendBulkWhatsAppRequestDto,
  WhatsAppPreviewRequestDto,
  TriggerTodayRemindersRequestDto,
  ReminderResponseDto,
  PushyaScheduleResponseDto,
  buildCreateReminderDto,
  buildUpdateReminderStatusDto,
  buildSendWhatsAppDto,
  buildSendBulkWhatsAppDto,
  buildWhatsAppPreviewDto,
  buildTriggerTodayRemindersDto,
  toReminderResponseDto,
  toReminderListResponseDto,
  toPushyaScheduleDto,
} from '../dtos/reminder.backend.dto.js';
import {
  IReminderFilterQuery,
  IReminderStats,
  IWhatsAppPreviewResult,
  IWhatsAppSendResult,
  IWhatsAppBatchDispatchResult,
  IWhatsAppMessageTemplate,
  IWhatsAppLogEntity,
} from '../interfaces/reminder.backend.interface.js';

export class ReminderService {
  private repository: ReminderRepository;
  private whatsAppService: WhatsAppService;

  constructor(
    repository = new ReminderRepository(),
    whatsAppService = new WhatsAppService()
  ) {
    this.repository = repository;
    this.whatsAppService = whatsAppService;
  }

  /**
   * Retrieves active Pushya calendar dates.
   */
  async getPushyaDates(): Promise<PushyaScheduleResponseDto[]> {
    const dates = await this.repository.getPushyaDates();
    return dates.map(toPushyaScheduleDto);
  }

  /**
   * Retrieves the next upcoming Pushya Nakshatra session with countdown and stage dates.
   */
  async getUpcomingPushyaInfo(): Promise<PushyaScheduleResponseDto | null> {
    const dates = await this.getPushyaDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = dates.find((d) => {
      const pDate = new Date(d.pushyaDate);
      return pDate >= today;
    });

    return upcoming || dates[0] || null;
  }

  /**
   * Adds or updates a Pushya calendar date (automatically computing the 3-days-prior Stage 1 fire date).
   * Also auto-enrolls all known patients for this new Pushya date with identical s1 and s2.
   */
  async addPushyaDate(pushyaDate: string, label?: string): Promise<PushyaScheduleResponseDto> {
    const created = await this.repository.addPushyaDate(pushyaDate, label);

    // Retrieve unique existing patients to auto-enroll them in the newly added Pushya date
    try {
      const allReminders = await this.repository.findReminders();
      const patientMap = new Map<string, { id: string; name: string; phone: string }>();
      for (const r of allReminders) {
        if (!patientMap.has(r.patientId)) {
          patientMap.set(r.patientId, { id: r.patientId, name: r.patientName, phone: r.phone });
        }
      }

      if (patientMap.size > 0) {
        await this.syncPatientsForPushya({
          pushyaDate: created.pushyaDate,
          patients: Array.from(patientMap.values()),
        });
      }
    } catch {}

    return toPushyaScheduleDto(created);
  }

  /**
   * Updates an existing Pushya date to a new date and cascades reminder schedule updates.
   */
  async updatePushyaDate(oldDate: string, newDate: string, label?: string): Promise<PushyaScheduleResponseDto> {
    const updated = await this.repository.updatePushyaDate(oldDate, newDate, label);
    return toPushyaScheduleDto(updated);
  }

  /**
   * Deletes a Pushya calendar date from MySQL and memory.
   */
  async deletePushyaDate(pushyaDate: string): Promise<boolean> {
    return this.repository.deletePushyaDate(pushyaDate);
  }

  /**
   * Retrieves reminders according to query filters (pushyaDate, stage, status, patientId).
   */
  async getReminders(filter?: IReminderFilterQuery): Promise<ReminderResponseDto[]> {
    const rows = await this.repository.findReminders(filter);
    return toReminderListResponseDto(rows);
  }

  /**
   * Creates a new reminder.
   */
  async createReminder(rawInput: any): Promise<ReminderResponseDto> {
    const dto: CreateReminderRequestDto = buildCreateReminderDto(rawInput);
    
    // Auto-generate WhatsApp message content if not provided
    if (!dto.messageContent) {
      dto.messageContent = this.whatsAppService.generateMessage(
        dto.stage,
        dto.patientName,
        dto.pushyaDate
      );
    }

    const created = await this.repository.createReminder(dto);
    await this.repository.addLog(
      created.id,
      'REMINDER_CREATED',
      `Stage ${dto.stage} reminder created for ${dto.patientName} on ${dto.pushyaDate}`
    );

    return toReminderResponseDto(created);
  }

  /**
   * Updates reminder status (e.g. sent, delivered, read, failed).
   */
  async updateStatus(id: string, rawInput: any): Promise<ReminderResponseDto | null> {
    const dto: UpdateReminderStatusDto = buildUpdateReminderStatusDto(rawInput);
    const updated = await this.repository.updateReminderStatus(id, dto);
    if (!updated) return null;
    return toReminderResponseDto(updated);
  }

  /**
   * Retrieves summary statistics for dashboard.
   */
  async getStatistics(): Promise<IReminderStats> {
    return this.repository.getStatistics();
  }

  /**
   * Returns WhatsApp templates for Stage 1 (3 days before) and Stage 2 (on Pushya day).
   */
  getWhatsAppTemplates(): IWhatsAppMessageTemplate[] {
    return this.whatsAppService.getTemplates();
  }

  /**
   * Previews WhatsApp message content and deep-link for a given patient and Pushya stage.
   */
  previewWhatsAppMessage(rawInput: any): IWhatsAppPreviewResult {
    const dto: WhatsAppPreviewRequestDto = buildWhatsAppPreviewDto(rawInput);
    return this.whatsAppService.previewMessage({
      patientName: dto.patientName || 'Reyansh Sharma',
      phone: dto.phone || '9876543210',
      pushyaDate: dto.pushyaDate || '2026-07-18',
      stage: dto.stage || 1,
      clinicInfo: dto.clinicInfo,
    });
  }

  /**
   * Sends or updates a single WhatsApp reminder for a patient.
   */
  async sendSingleWhatsAppReminder(rawInput: any): Promise<IWhatsAppSendResult> {
    const dto: SendWhatsAppRequestDto = buildSendWhatsAppDto(rawInput);

    // Check if reminder already exists
    let reminder = dto.reminderId
      ? await this.repository.findById(dto.reminderId)
      : await this.repository.findByPatientDateStage(dto.patientId, dto.pushyaDate, dto.stage);

    if (!reminder) {
      const scheduledDate =
        dto.stage === 1
          ? this.whatsAppService.calculateOffsetDate(dto.pushyaDate, -3)
          : dto.pushyaDate;

      const messageContent =
        dto.customMessage ||
        this.whatsAppService.generateMessage(dto.stage, dto.patientName, dto.pushyaDate);

      reminder = await this.repository.createReminder({
        patientId: dto.patientId,
        patientName: dto.patientName,
        phone: dto.phone,
        pushyaDate: dto.pushyaDate,
        stage: dto.stage,
        scheduledDate,
        messageContent,
      });
    }

    const sendResult = await this.whatsAppService.sendWhatsApp({
      reminderId: reminder.id,
      patientId: dto.patientId,
      patientName: dto.patientName,
      phone: dto.phone,
      pushyaDate: dto.pushyaDate,
      stage: dto.stage,
      messageContent: dto.customMessage || reminder.messageContent,
      simulateDelivery: dto.simulateDelivery,
    });

    if (sendResult.success) {
      await this.repository.updateReminderStatus(reminder.id, {
        status: 'sent',
        timestampStr: sendResult.sentAt,
      });

      await this.repository.addLog(
        reminder.id,
        'WHATSAPP_MESSAGE_SENT',
        `WhatsApp Stage ${dto.stage} message dispatched to ${dto.phone} (${dto.patientName})`
      );
    } else {
      await this.repository.updateReminderStatus(reminder.id, {
        status: 'failed',
      });

      await this.repository.addLog(
        reminder.id,
        'WHATSAPP_MESSAGE_FAILED',
        `Failed to send WhatsApp message to ${dto.phone}: ${sendResult.error}`
      );
    }

    return sendResult;
  }

  /**
   * Bulk sends WhatsApp reminders for all patients enrolled for a given Pushya date and stage.
   * Stage 1 = 3 days before Pushya Nakshatra
   * Stage 2 = On Pushya Nakshatra day
   */
  async sendBulkWhatsAppReminders(rawInput: any): Promise<IWhatsAppBatchDispatchResult> {
    const dto: SendBulkWhatsAppRequestDto = buildSendBulkWhatsAppDto(rawInput);
    
    // Retrieve existing scheduled reminders for this Pushya date & stage
    let reminders = await this.repository.findReminders({
      pushyaDate: dto.pushyaDate,
      stage: dto.stage,
    });

    // If specific patientIds were requested, filter them
    if (dto.patientIds && dto.patientIds.length > 0) {
      reminders = reminders.filter((r) => dto.patientIds?.includes(r.patientId));
    }

    const dispatches: IWhatsAppSendResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    const scheduledDate =
      dto.stage === 1
        ? this.whatsAppService.calculateOffsetDate(dto.pushyaDate, -3)
        : dto.pushyaDate;

    for (const rem of reminders) {
      const sendResult = await this.whatsAppService.sendWhatsApp({
        reminderId: rem.id,
        patientId: rem.patientId,
        patientName: rem.patientName,
        phone: rem.phone,
        pushyaDate: rem.pushyaDate,
        stage: rem.stage,
        messageContent: rem.messageContent,
        simulateDelivery: dto.simulateDelivery,
      });

      if (sendResult.success) {
        successCount++;
        await this.repository.updateReminderStatus(rem.id, {
          status: 'sent',
          timestampStr: sendResult.sentAt,
        });

        await this.repository.addLog(
          rem.id,
          'WHATSAPP_BATCH_SENT',
          `Batch WhatsApp Stage ${dto.stage} sent to ${rem.patientName} (${rem.phone})`
        );
      } else {
        failedCount++;
        await this.repository.updateReminderStatus(rem.id, {
          status: 'failed',
        });

        await this.repository.addLog(
          rem.id,
          'WHATSAPP_BATCH_FAILED',
          `Failed dispatch to ${rem.phone}: ${sendResult.error}`
        );
      }

      dispatches.push(sendResult);
    }

    return {
      pushyaDate: dto.pushyaDate,
      stage: dto.stage,
      scheduledDate,
      totalProcessed: reminders.length,
      successCount,
      failedCount,
      dispatches,
      dispatchedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates today's date against Pushya schedules and triggers due WhatsApp reminders:
   * - 1 Day Before Pushya Date (Reminder Fire Date)
   */
  async triggerTodayReminders(rawInput: any): Promise<{
    evaluatedDate: string;
    stage1Results: IWhatsAppBatchDispatchResult[];
    stage2Results: IWhatsAppBatchDispatchResult[];
    totalMessagesSent: number;
  }> {
    const dto: TriggerTodayRemindersRequestDto = buildTriggerTodayRemindersDto(rawInput);
    const targetDate = dto.targetDate || this.getTodayDateString();

    const pushyaList = await this.repository.getPushyaDates();
    const stage1Results: IWhatsAppBatchDispatchResult[] = [];
    const stage2Results: IWhatsAppBatchDispatchResult[] = [];
    let totalMessagesSent = 0;

    for (const pushya of pushyaList) {
      if (!pushya.isActive) continue;

      // 1 Day Before Pushya Date
      if (pushya.stage1FireDate === targetDate) {
        const res = await this.sendBulkWhatsAppReminders({
          pushyaDate: pushya.pushyaDate,
          stage: 1,
          simulateDelivery: dto.simulateDelivery,
        });
        stage1Results.push(res);
        totalMessagesSent += res.successCount;
      }
    }

    return {
      evaluatedDate: targetDate,
      stage1Results,
      stage2Results,
      totalMessagesSent,
    };
  }

  /**
   * Retrieves audit logs for WhatsApp dispatches.
   */
  async getWhatsAppLogs(filter?: { reminderId?: string; limit?: number }): Promise<IWhatsAppLogEntity[]> {
    return this.repository.getLogs(filter);
  }

  /**
   * Syncs reminders for a list of patients for an upcoming Pushya session or all Pushya sessions.
   * Ensures Reminder (1 day before Pushya - s1) fire dates are identical for every user.
   */
  async syncPatientsForPushya(dto: SyncPatientsDto): Promise<{ createdCount: number; pushyaDate: string }> {
    const pushyaList = await this.repository.getPushyaDates();
    
    // If pushyaDate is 'all' or empty, enroll across all active Pushya dates
    const targetDates =
      dto.pushyaDate && dto.pushyaDate !== 'all'
        ? pushyaList.filter((p) => p.pushyaDate === dto.pushyaDate)
        : pushyaList.filter((p) => p.isActive);

    let createdCount = 0;

    for (const pushyaConfig of targetDates) {
      const pDate = pushyaConfig.pushyaDate;
      const stage1Date = pushyaConfig.stage1FireDate;

      for (const p of dto.patients) {
        // WhatsApp Reminder (1 day before Pushya Date)
        const existingStage1 = await this.repository.findByPatientDateStage(p.id, pDate, 1);
        if (!existingStage1) {
          const msg1 = this.whatsAppService.generateMessage(1, p.name, pDate);
          await this.repository.createReminder({
            patientId: p.id,
            patientName: p.name,
            phone: p.phone,
            pushyaDate: pDate,
            stage: 1,
            scheduledDate: stage1Date,
            messageContent: msg1,
          });
          createdCount++;
        }
      }
    }

    return { createdCount, pushyaDate: dto.pushyaDate || 'all' };
  }

  private getTodayDateString(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
