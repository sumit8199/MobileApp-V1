import cron from 'node-cron';
import { ReminderService } from './reminder.service.js';
export class SchedulerService {
    task = null;
    isRunning = false;
    reminderService;
    dispatchHour;
    dispatchMinute;
    cronExpression;
    timezone;
    lastRunAt = null;
    lastDispatchedDate = null;
    lastRunStatus = 'Initialized';
    constructor(reminderService, cronExpression) {
        this.reminderService = reminderService;
        const envHour = parseInt(process.env.REMINDER_DISPATCH_HOUR || '11', 10);
        const envMinute = parseInt(process.env.REMINDER_DISPATCH_MINUTE || '0', 10);
        this.dispatchHour = isNaN(envHour) ? 11 : envHour;
        this.dispatchMinute = isNaN(envMinute) ? 0 : envMinute;
        this.cronExpression =
            cronExpression ||
                process.env.REMINDER_CRON_EXPRESSION ||
                `${this.dispatchMinute} ${this.dispatchHour} * * *`;
        this.timezone =
            process.env.REMINDER_TIMEZONE ||
                process.env.TIMEZONE ||
                'Asia/Kolkata';
    }
    start() {
        if (this.isRunning)
            return;
        try {
            const formattedTime = this.getFormattedDispatchTime();
            console.log(`⏰ [SchedulerService] Initializing WhatsApp reminder cron job...`);
            console.log(`🕒 [SchedulerService] Configured Daily Dispatch Time: ${formattedTime} (${this.timezone})`);
            console.log(`📅 [SchedulerService] Cron Schedule: "${this.cronExpression}" [Timezone: ${this.timezone}]`);
            console.log(`📍 [SchedulerService] Current Time in ${this.timezone}: ${this.getCurrentDateTimeInTimezone()}`);
            this.task = cron.schedule(this.cronExpression, async () => {
                console.log(`\n🔔 [SchedulerService] === 11:00 AM Cron Trigger Fired ===`);
                console.log(`🕒 [SchedulerService] Execution Time: ${this.getCurrentDateTimeInTimezone()}`);
                try {
                    await this.evaluateSchedules();
                }
                catch (err) {
                    this.lastRunStatus = `Error: ${err.message}`;
                    console.error(`❌ [SchedulerService] Error executing 11:00 AM scheduled reminder:`, err);
                }
            }, {
                timezone: this.timezone,
            });
            this.isRunning = true;
            this.lastRunStatus = `Active (Scheduled daily at ${formattedTime} ${this.timezone})`;
            console.log(`✅ [SchedulerService] WhatsApp Reminder Cron active and running.`);
        }
        catch (err) {
            console.error(`💥 [SchedulerService] Failed to start cron scheduler:`, err.message);
            this.lastRunStatus = `Failed to start: ${err.message}`;
        }
    }
    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
        this.isRunning = false;
        this.lastRunStatus = 'Stopped';
        console.log(`🛑 [SchedulerService] WhatsApp reminder cron scheduler stopped.`);
    }
    async evaluateSchedules(targetDateStr, forceDispatch = false) {
        const todayStr = targetDateStr || this.getTodayDateString();
        this.lastRunAt = new Date().toISOString();
        console.log(`🔍 [SchedulerService] Evaluating Pushya schedules for date: ${todayStr} (Timezone: ${this.timezone})...`);
        if (!targetDateStr && !forceDispatch && this.lastDispatchedDate === todayStr) {
            const msg = `Automated reminders already dispatched today (${todayStr}) at 11:00 AM. Skipping duplicate send.`;
            console.log(`ℹ️ [SchedulerService] ${msg}`);
            this.lastRunStatus = `Completed (Skipped duplicate for ${todayStr})`;
            return {
                dateEvaluated: todayStr,
                stage1Dispatches: [],
                stage2Dispatches: [],
                messagesSent: 0,
                dispatched: false,
                reason: msg,
            };
        }
        const pushyaDates = await this.reminderService.getPushyaDates();
        const stage1Dispatches = [];
        const stage2Dispatches = [];
        let messagesSent = 0;
        for (const pushya of pushyaDates) {
            if (!pushya.isActive)
                continue;
            if (pushya.stage1FireDate === todayStr) {
                console.log(`📢 [SchedulerService] Match found at 11:00 AM: Today is 1 day before Pushya session ${pushya.pushyaDate} (${pushya.label || 'Pushya'}).`);
                console.log(`📲 [SchedulerService] Dispatching WhatsApp reminder batch to all enrolled patients...`);
                const isLiveMeta = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID &&
                    process.env.WHATSAPP_ACCESS_TOKEN &&
                    process.env.WHATSAPP_PHONE_NUMBER_ID !== 'your_meta_phone_number_id_here');
                const result = await this.reminderService.sendBulkWhatsAppReminders({
                    pushyaDate: pushya.pushyaDate,
                    stage: 1,
                    simulateDelivery: !isLiveMeta,
                });
                stage1Dispatches.push(result);
                messagesSent += result.successCount;
                this.lastDispatchedDate = todayStr;
            }
        }
        if (stage1Dispatches.length === 0) {
            console.log(`ℹ️ [SchedulerService] No Pushya fire dates matched for ${todayStr}. No automated WhatsApp messages needed today.`);
            this.lastRunStatus = `Completed (No sessions due on ${todayStr})`;
        }
        else {
            console.log(`✅ [SchedulerService] Completed 11:00 AM WhatsApp dispatch for ${todayStr}. Total messages sent: ${messagesSent}.`);
            this.lastRunStatus = `Success (Dispatched ${messagesSent} messages on ${todayStr})`;
        }
        return {
            dateEvaluated: todayStr,
            stage1Dispatches,
            stage2Dispatches,
            messagesSent,
            dispatched: stage1Dispatches.length > 0,
        };
    }
    getTodayDateString() {
        try {
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: this.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
            return formatter.format(new Date());
        }
        catch {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    }
    getCurrentDateTimeInTimezone() {
        try {
            return new Intl.DateTimeFormat('en-IN', {
                timeZone: this.timezone,
                dateStyle: 'full',
                timeStyle: 'medium',
            }).format(new Date());
        }
        catch {
            return new Date().toISOString();
        }
    }
    getFormattedDispatchTime() {
        const period = this.dispatchHour >= 12 ? 'PM' : 'AM';
        const hour12 = this.dispatchHour % 12 === 0 ? 12 : this.dispatchHour % 12;
        const minStr = String(this.dispatchMinute).padStart(2, '0');
        return `${hour12}:${minStr} ${period}`;
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            dispatchTime: this.getFormattedDispatchTime(),
            dispatchHour: this.dispatchHour,
            dispatchMinute: this.dispatchMinute,
            cronExpression: this.cronExpression,
            timezone: this.timezone,
            lastRunAt: this.lastRunAt,
            lastDispatchedDate: this.lastDispatchedDate,
            lastRunStatus: this.lastRunStatus,
            currentTimeInZone: this.getCurrentDateTimeInTimezone(),
        };
    }
}
let defaultSchedulerService = null;
export function getSchedulerService(reminderService) {
    if (!defaultSchedulerService) {
        defaultSchedulerService = new SchedulerService(reminderService || new ReminderService());
    }
    return defaultSchedulerService;
}
//# sourceMappingURL=scheduler.service.js.map