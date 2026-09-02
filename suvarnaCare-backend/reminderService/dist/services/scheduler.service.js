export class SchedulerService {
    timer = null;
    isRunning = false;
    intervalMs;
    reminderService;
    constructor(reminderService, intervalMs = 60 * 60 * 1000) {
        this.reminderService = reminderService;
        this.intervalMs = intervalMs;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log(`⏰ [SchedulerService] Pushya WhatsApp reminder scheduler started (Interval: ${this.intervalMs / 1000}s).`);
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
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        console.log(`🛑 [SchedulerService] Pushya WhatsApp reminder scheduler stopped.`);
    }
    async evaluateSchedules(targetDateStr) {
        const todayStr = targetDateStr || this.getTodayDateString();
        console.log(`🔍 [SchedulerService] Evaluating Pushya schedules for date: ${todayStr}...`);
        const pushyaDates = await this.reminderService.getPushyaDates();
        const stage1Dispatches = [];
        const stage2Dispatches = [];
        let messagesSent = 0;
        for (const pushya of pushyaDates) {
            if (!pushya.isActive)
                continue;
            if (pushya.stage1FireDate === todayStr) {
                console.log(`📢 [SchedulerService] Match found: Today is 3 days before Pushya date ${pushya.pushyaDate} (${pushya.label || 'Pushya'}). Triggering Stage 1 WhatsApp alerts!`);
                const result = await this.reminderService.sendBulkWhatsAppReminders({
                    pushyaDate: pushya.pushyaDate,
                    stage: 1,
                    simulateDelivery: true,
                });
                stage1Dispatches.push(result);
                messagesSent += result.successCount;
            }
            if (pushya.stage2FireDate === todayStr || pushya.pushyaDate === todayStr) {
                console.log(`📢 [SchedulerService] Match found: Today is Pushya Nakshatra day ${pushya.pushyaDate} (${pushya.label || 'Pushya'}). Triggering Stage 2 WhatsApp alerts!`);
                const result = await this.reminderService.sendBulkWhatsAppReminders({
                    pushyaDate: pushya.pushyaDate,
                    stage: 2,
                    simulateDelivery: true,
                });
                stage2Dispatches.push(result);
                messagesSent += result.successCount;
            }
        }
        if (stage1Dispatches.length === 0 && stage2Dispatches.length === 0) {
            console.log(`ℹ️ [SchedulerService] No Pushya fire dates matched for ${todayStr}. No automated WhatsApp messages needed today.`);
        }
        else {
            console.log(`✅ [SchedulerService] Completed WhatsApp dispatch for ${todayStr}. Total messages sent: ${messagesSent}.`);
        }
        return {
            dateEvaluated: todayStr,
            stage1Dispatches,
            stage2Dispatches,
            messagesSent,
        };
    }
    getTodayDateString() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalMs: this.intervalMs,
        };
    }
}
//# sourceMappingURL=scheduler.service.js.map