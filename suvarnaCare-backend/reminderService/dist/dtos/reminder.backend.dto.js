export function buildCreateReminderDto(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid reminder payload: Expected object.');
    }
    const patientId = String(input.patientId || input.patient_id || '').trim();
    const patientName = String(input.patientName || input.patient_name || '').trim();
    const phone = String(input.phone || '').replace(/\D/g, '').slice(-10);
    const pushyaDate = String(input.pushyaDate || input.pushya_date || '').trim();
    const stage = Number(input.stage) === 2 ? 2 : 1;
    const scheduledDate = String(input.scheduledDate || input.scheduled_date || pushyaDate).trim();
    const messageContent = input.messageContent ? String(input.messageContent) : undefined;
    if (!patientId)
        throw new Error('Validation Error: patientId is required.');
    if (!patientName)
        throw new Error('Validation Error: patientName is required.');
    if (!phone || phone.length < 10)
        throw new Error('Validation Error: Valid 10-digit phone number is required.');
    if (!pushyaDate)
        throw new Error('Validation Error: pushyaDate is required.');
    return {
        patientId,
        patientName,
        phone,
        pushyaDate,
        stage,
        scheduledDate,
        messageContent,
    };
}
export function buildUpdateReminderStatusDto(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid payload: Expected object.');
    }
    const validStatuses = ['scheduled', 'sent', 'delivered', 'read', 'failed'];
    const status = String(input.status).toLowerCase();
    if (!validStatuses.includes(status)) {
        throw new Error(`Validation Error: Invalid status '${input.status}'. Allowed: ${validStatuses.join(', ')}`);
    }
    const timestampStr = input.timestampStr || new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return {
        status,
        timestampStr,
    };
}
export function buildSendWhatsAppDto(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid WhatsApp payload: Expected object.');
    }
    const patientId = String(input.patientId || input.patient_id || '').trim();
    const patientName = String(input.patientName || input.patient_name || '').trim();
    const phone = String(input.phone || '').replace(/\D/g, '').slice(-10);
    const pushyaDate = String(input.pushyaDate || input.pushya_date || '').trim();
    const stage = Number(input.stage) === 2 ? 2 : 1;
    if (!patientId)
        throw new Error('Validation Error: patientId is required.');
    if (!patientName)
        throw new Error('Validation Error: patientName is required.');
    if (!phone || phone.length < 10)
        throw new Error('Validation Error: Valid 10-digit phone number is required.');
    if (!pushyaDate)
        throw new Error('Validation Error: pushyaDate is required.');
    return {
        reminderId: input.reminderId || input.id,
        patientId,
        patientName,
        phone,
        pushyaDate,
        stage,
        customMessage: input.customMessage || input.messageContent,
        simulateDelivery: input.simulateDelivery !== false,
    };
}
export function buildSendBulkWhatsAppDto(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid Bulk WhatsApp payload: Expected object.');
    }
    const pushyaDate = String(input.pushyaDate || input.pushya_date || '').trim();
    const stage = Number(input.stage) === 2 ? 2 : 1;
    if (!pushyaDate)
        throw new Error('Validation Error: pushyaDate is required.');
    return {
        pushyaDate,
        stage,
        patientIds: Array.isArray(input.patientIds) ? input.patientIds : undefined,
        simulateDelivery: input.simulateDelivery !== false,
    };
}
export function buildWhatsAppPreviewDto(input) {
    const stage = Number(input?.stage) === 2 ? 2 : 1;
    return {
        patientName: input?.patientName || 'Reyansh Sharma',
        phone: input?.phone || '9876543210',
        pushyaDate: input?.pushyaDate || '2026-07-18',
        stage,
        clinicInfo: input?.clinicInfo,
    };
}
export function buildTriggerTodayRemindersDto(input) {
    return {
        targetDate: input?.targetDate ? String(input.targetDate).trim() : undefined,
        simulateDelivery: input?.simulateDelivery !== false,
    };
}
export function toReminderResponseDto(row) {
    if ('patient_id' in row) {
        const cleanPhone = String(row.phone || '').replace(/\D/g, '').slice(-10);
        const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const textEncoded = encodeURIComponent(row.message_content || `Suvarna Prashan reminder on ${row.pushya_date}`);
        const whatsAppUrl = `https://wa.me/${phoneWithCountry}?text=${textEncoded}`;
        return {
            id: row.id,
            patientId: row.patient_id,
            patientName: row.patient_name,
            phone: row.phone,
            pushyaDate: row.pushya_date,
            stage: row.stage,
            scheduledDate: row.scheduled_date,
            status: row.status,
            sentAt: row.sent_at || undefined,
            deliveredAt: row.delivered_at || undefined,
            readAt: row.read_at || undefined,
            messageContent: row.message_content || undefined,
            whatsAppUrl,
        };
    }
    const cleanPhone = String(row.phone || '').replace(/\D/g, '').slice(-10);
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const textEncoded = encodeURIComponent(row.messageContent || `Suvarna Prashan reminder on ${row.pushyaDate}`);
    const whatsAppUrl = `https://wa.me/${phoneWithCountry}?text=${textEncoded}`;
    return {
        id: row.id,
        patientId: row.patientId,
        patientName: row.patientName,
        phone: row.phone,
        pushyaDate: row.pushyaDate,
        stage: row.stage,
        scheduledDate: row.scheduledDate,
        status: row.status,
        sentAt: row.sentAt,
        deliveredAt: row.deliveredAt,
        readAt: row.readAt,
        messageContent: row.messageContent,
        whatsAppUrl,
    };
}
export function toReminderListResponseDto(rows) {
    return rows.map(toReminderResponseDto);
}
export function toPushyaScheduleDto(entity) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pushya = new Date(entity.pushyaDate);
    const stage1 = new Date(entity.stage1FireDate);
    const daysToPushya = Math.ceil((pushya.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysToStage1 = Math.ceil((stage1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
        pushyaDate: entity.pushyaDate,
        stage1FireDate: entity.stage1FireDate,
        stage2FireDate: entity.stage2FireDate,
        label: entity.label,
        isActive: entity.isActive,
        daysToPushya: isNaN(daysToPushya) ? undefined : daysToPushya,
        daysToStage1: isNaN(daysToStage1) ? undefined : daysToStage1,
    };
}
export function buildApiResponse(data, message = 'Success', success = true, isDbConnected = true) {
    return {
        success,
        message,
        data,
        timestamp: new Date().toISOString(),
        databaseConnected: isDbConnected,
    };
}
//# sourceMappingURL=reminder.backend.dto.js.map