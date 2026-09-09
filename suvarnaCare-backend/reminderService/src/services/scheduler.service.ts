import { ReminderRepository } from '../repositories/reminder.repository.js';
import { WhatsAppService } from './whatsapp.service.js';
import { ReminderService } from './reminder.service.js';
import { IWhatsAppBatchDispatchResult } from '../interfaces/reminder.backend.interface.js';

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMs: number;
  private reminderService: ReminderService;

  constructor(
    reminderService: ReminderService,
    intervalMs: number = 60 * 60 * 1000 // Default: Check every 1 hour
  ) {
    this.reminderService = reminderService;
    this.intervalMs = intervalMs;
  }

  /**
   * Starts background scheduler loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`⏰ [SchedulerService] Pushya WhatsApp reminder scheduler started (Interval: ${this.intervalMs / 1000}s).`);

    // Perform initial check on startup after a small delay
    setTimeout(() => {
      this.evaluateSchedules().catch((err) => {
        console.warn(`⚠️ [SchedulerService] Initial schedule check error:`, err.message);
      });
    }, 5000);

    this.timer = setInterval(() => {
      this.evaluateSchedules().catch((err) => {
        console.warn(`⚠️ [SchedulerService] Interval schedule check error:`, err.message);
      });
    }, this.intervalMs);
  }

  /**
   * Stops background scheduler loop.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log(`🛑 [SchedulerService] Pushya WhatsApp reminder scheduler stopped.`);
  }

  /**
   * Evaluates today's date against Pushya Nakshatra calendar.
   * - If today == stage1FireDate (1 day before): Trigger WhatsApp reminders.
   */
  async evaluateSchedules(targetDateStr?: string): Promise<{
    dateEvaluated: string;
    stage1Dispatches: IWhatsAppBatchDispatchResult[];
    stage2Dispatches: IWhatsAppBatchDispatchResult[];
    messagesSent: number;
  }> {
    const todayStr = targetDateStr || this.getTodayDateString();
    console.log(`🔍 [SchedulerService] Evaluating Pushya schedules for date: ${todayStr}...`);

    const pushyaDates = await this.reminderService.getPushyaDates();
    const stage1Dispatches: IWhatsAppBatchDispatchResult[] = [];
    const stage2Dispatches: IWhatsAppBatchDispatchResult[] = [];
    let messagesSent = 0;

    for (const pushya of pushyaDates) {
      if (!pushya.isActive) continue;

      // 1. Check Reminder Fire Date (1 Day Before Pushya Date)
      if (pushya.stage1FireDate === todayStr) {
        console.log(`📢 [SchedulerService] Match found: Today is 1 day before Pushya date ${pushya.pushyaDate} (${pushya.label || 'Pushya'}). Triggering WhatsApp alerts!`);
        const result = await this.reminderService.sendBulkWhatsAppReminders({
          pushyaDate: pushya.pushyaDate,
          stage: 1,
          simulateDelivery: true,
        });
        stage1Dispatches.push(result);
        messagesSent += result.successCount;
      }
    }

    if (stage1Dispatches.length === 0) {
      console.log(`ℹ️ [SchedulerService] No Pushya fire dates matched for ${todayStr}. No automated WhatsApp messages needed today.`);
    } else {
      console.log(`✅ [SchedulerService] Completed WhatsApp dispatch for ${todayStr}. Total messages sent: ${messagesSent}.`);
    }

    return {
      dateEvaluated: todayStr,
      stage1Dispatches,
      stage2Dispatches,
      messagesSent,
    };
  }

  /**
   * Helper to format current date as YYYY-MM-DD.
   */
  private getTodayDateString(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  public getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
    };
  }
}
