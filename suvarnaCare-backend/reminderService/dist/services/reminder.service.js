import { ReminderRepository } from '../repositories/reminder.repository.js';
import { WhatsAppService } from './whatsapp.service.js';
import { buildCreateReminderDto, buildUpdateReminderStatusDto, buildSendWhatsAppDto, buildSendBulkWhatsAppDto, buildWhatsAppPreviewDto, buildTriggerTodayRemindersDto, toReminderResponseDto, toReminderListResponseDto, toPushyaScheduleDto, } from '../dtos/reminder.backend.dto.js';
export class ReminderService {
    repository;
    whatsAppService;
    constructor(repository = new ReminderRepository(), whatsAppService = new WhatsAppService()) {
        this.repository = repository;
        this.whatsAppService = whatsAppService;
    }
    async getPushyaDates() {
        const dates = await this.repository.getPushyaDates();
        return dates.map(toPushyaScheduleDto);
    }
    async getUpcomingPushyaInfo() {
        const dates = await this.getPushyaDates();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = dates.find((d) => {
            const pDate = new Date(d.pushyaDate);
            return pDate >= today;
        });
        return upcoming || dates[0] || null;
    }
    async addPushyaDate(pushyaDate, label) {
        const created = await this.repository.addPushyaDate(pushyaDate, label);
        try {
            const allReminders = await this.repository.findReminders();
            const patientMap = new Map();
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
        }
        catch { }
        return toPushyaScheduleDto(created);
    }
    async updatePushyaDate(oldDate, newDate, label) {
        const updated = await this.repository.updatePushyaDate(oldDate, newDate, label);
        return toPushyaScheduleDto(updated);
    }
    async deletePushyaDate(pushyaDate) {
        return this.repository.deletePushyaDate(pushyaDate);
    }
    async getReminders(filter) {
        const rows = await this.repository.findReminders(filter);
        return toReminderListResponseDto(rows);
    }
    async createReminder(rawInput) {
        const dto = buildCreateReminderDto(rawInput);
        if (!dto.messageContent) {
            dto.messageContent = this.whatsAppService.generateMessage(dto.stage, dto.patientName, dto.pushyaDate);
        }
        const created = await this.repository.createReminder(dto);
        await this.repository.addLog(created.id, 'REMINDER_CREATED', `Stage ${dto.stage} reminder created for ${dto.patientName} on ${dto.pushyaDate}`);
        return toReminderResponseDto(created);
    }
    async updateStatus(id, rawInput) {
        const dto = buildUpdateReminderStatusDto(rawInput);
        const updated = await this.repository.updateReminderStatus(id, dto);
        if (!updated)
            return null;
        return toReminderResponseDto(updated);
    }
    async getStatistics() {
        return this.repository.getStatistics();
    }
    getWhatsAppTemplates() {
        return this.whatsAppService.getTemplates();
    }
    previewWhatsAppMessage(rawInput) {
        const dto = buildWhatsAppPreviewDto(rawInput);
        return this.whatsAppService.previewMessage({
            patientName: dto.patientName || 'Reyansh Sharma',
            phone: dto.phone || '9876543210',
            pushyaDate: dto.pushyaDate || '2026-07-18',
            stage: dto.stage || 1,
            clinicInfo: dto.clinicInfo,
        });
    }
    async sendSingleWhatsAppReminder(rawInput) {
        const dto = buildSendWhatsAppDto(rawInput);
        let reminder = dto.reminderId
            ? await this.repository.findById(dto.reminderId)
            : await this.repository.findByPatientDateStage(dto.patientId, dto.pushyaDate, dto.stage);
        if (!reminder) {
            const scheduledDate = dto.stage === 1
                ? this.whatsAppService.calculateOffsetDate(dto.pushyaDate, -3)
                : dto.pushyaDate;
            const messageContent = dto.customMessage ||
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
            await this.repository.addLog(reminder.id, 'WHATSAPP_MESSAGE_SENT', `WhatsApp Stage ${dto.stage} message dispatched to ${dto.phone} (${dto.patientName})`);
        }
        else {
            await this.repository.updateReminderStatus(reminder.id, {
                status: 'failed',
            });
            await this.repository.addLog(reminder.id, 'WHATSAPP_MESSAGE_FAILED', `Failed to send WhatsApp message to ${dto.phone}: ${sendResult.error}`);
        }
        return sendResult;
    }
    async sendBulkWhatsAppReminders(rawInput) {
        const dto = buildSendBulkWhatsAppDto(rawInput);
        let reminders = await this.repository.findReminders({
            pushyaDate: dto.pushyaDate,
            stage: dto.stage,
        });
        if (dto.patientIds && dto.patientIds.length > 0) {
            reminders = reminders.filter((r) => dto.patientIds?.includes(r.patientId));
        }
        const dispatches = [];
        let successCount = 0;
        let failedCount = 0;
        const scheduledDate = dto.stage === 1
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
                await this.repository.addLog(rem.id, 'WHATSAPP_BATCH_SENT', `Batch WhatsApp Stage ${dto.stage} sent to ${rem.patientName} (${rem.phone})`);
            }
            else {
                failedCount++;
                await this.repository.updateReminderStatus(rem.id, {
                    status: 'failed',
                });
                await this.repository.addLog(rem.id, 'WHATSAPP_BATCH_FAILED', `Failed dispatch to ${rem.phone}: ${sendResult.error}`);
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
    async triggerTodayReminders(rawInput) {
        const dto = buildTriggerTodayRemindersDto(rawInput);
        const targetDate = dto.targetDate || this.getTodayDateString();
        const pushyaList = await this.repository.getPushyaDates();
        const stage1Results = [];
        const stage2Results = [];
        let totalMessagesSent = 0;
        for (const pushya of pushyaList) {
            if (!pushya.isActive)
                continue;
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
    async getWhatsAppLogs(filter) {
        return this.repository.getLogs(filter);
    }
    async syncPatientsForPushya(dto) {
        const pushyaList = await this.repository.getPushyaDates();
        const targetDates = dto.pushyaDate && dto.pushyaDate !== 'all'
            ? pushyaList.filter((p) => p.pushyaDate === dto.pushyaDate)
            : pushyaList.filter((p) => p.isActive);
        let createdCount = 0;
        for (const pushyaConfig of targetDates) {
            const pDate = pushyaConfig.pushyaDate;
            const stage1Date = pushyaConfig.stage1FireDate;
            for (const p of dto.patients) {
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
    getTodayDateString() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
//# sourceMappingURL=reminder.service.js.map