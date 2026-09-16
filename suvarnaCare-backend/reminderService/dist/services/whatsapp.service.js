export class WhatsAppService {
    defaultClinicInfo = {
        clinicName: process.env.CLINIC_NAME || 'Mauli Clinic',
        doctorName: process.env.DOCTOR_NAME || 'Dr. Suraj Yeole',
        doctorQualification: process.env.DOCTOR_QUALIFICATION || 'BAMS, MD (Pediatrics)',
        phone: process.env.CLINIC_PHONE || '+91 9767976136',
        address: process.env.CLINIC_ADDRESS || 'Mauli Clinic & Child Wellness Center, Nashik.',
        timings: process.env.CLINIC_TIMINGS || '09:00 AM - 01:00 PM & 05:00 PM - 08:30 PM',
    };
    getTemplates() {
        return [
            {
                stage: 1,
                title: 'Pushyamrut Advance Alert (1 Day Before)',
                description: 'Sent 1 day prior to the Pushya Nakshatra date to help parents prepare and bring their child tomorrow.',
                timingDescription: '1 Day Before Pushya Date (Reminder Fire Date)',
                template: '🌿 *SUVARNA PRASHAN REMINDER* 🌿\n\n' +
                    'Dear Parent / Guardian,\n\n' +
                    'This is a reminder from *{clinicName}* that tomorrow (*{formattedDate}*) is the auspicious day of *Pushya Nakshatra*!\n\n' +
                    'Please bring *{patientName}* to *{clinicName}* tomorrow to administer the monthly dose of pure Ayurvedic *Suvarna Prashan Drops (24K Gold Bhasma + Medhya Herbs + Pure Cow Ghee & Honey)*.\n\n' +
                    '🧒 *Child Name*: *{patientName}*\n' +
                    '🗓️ *Pushya Date*: Tomorrow, *{formattedDate}*\n' +
                    '⏰ *Clinic Timings*: {timings}\n' +
                    '📍 *Location*: {clinicName}, {address}\n\n' +
                    '✨ *Why Suvarna Prashan on Pushya Nakshatra?*\n' +
                    '• Boosts memory, intellect (Medha) & grasping power\n' +
                    '• Strengthens natural immunity (Vyadhikshamatva)\n' +
                    '• Improves digestion, vitality, physical strength & complexion\n\n' +
                    '📝 *Quick Instructions:*\n' +
                    '1. Administer drops on an empty or light stomach for optimal absorption.\n' +
                    '2. Avoid giving cold water or dairy for 30 minutes after drops.\n' +
                    '3. Please bring your child’s Suvarna Prashan card.\n\n' +
                    'For appointments or queries:\n' +
                    '📞 Call / WhatsApp: {phone}\n' +
                    '🩺 Consult: *{doctorName}* ({doctorQualification})\n\n' +
                    '_Wishing your child divine health and golden immunity!_ 🌿✨',
            },
        ];
    }
    formatPushyaDate(dateStr) {
        if (!dateStr)
            return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    });
                }
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            }
        }
        catch { }
        return dateStr;
    }
    generateMessage(stage, patientName, pushyaDate, clinicInfo) {
        const info = { ...this.defaultClinicInfo, ...clinicInfo };
        const formattedDate = this.formatPushyaDate(pushyaDate);
        const templates = this.getTemplates();
        const tplObj = templates.find((t) => t.stage === stage) || templates[0];
        return tplObj.template
            .replace(/{patientName}/g, patientName)
            .replace(/{formattedDate}/g, formattedDate)
            .replace(/{pushyaDate}/g, pushyaDate)
            .replace(/{clinicName}/g, info.clinicName)
            .replace(/{doctorName}/g, info.doctorName)
            .replace(/{doctorQualification}/g, info.doctorQualification)
            .replace(/{phone}/g, info.phone)
            .replace(/{address}/g, info.address || 'Ayush Bhavan, Health Road')
            .replace(/{timings}/g, info.timings || '09:00 AM - 01:00 PM & 05:00 PM - 08:30 PM');
    }
    generateWhatsAppLink(phone, message) {
        const cleanDigits = phone.replace(/\D/g, '');
        const nationalNumber = cleanDigits.slice(-10);
        const countryCode = cleanDigits.length > 10 ? cleanDigits.slice(0, cleanDigits.length - 10) : '91';
        const fullPhone = `${countryCode}${nationalNumber}`;
        const encodedText = encodeURIComponent(message);
        return `https://wa.me/${fullPhone}?text=${encodedText}`;
    }
    previewMessage(options) {
        const messageContent = this.generateMessage(options.stage, options.patientName, options.pushyaDate, options.clinicInfo);
        const scheduledDate = options.scheduledDate ||
            (options.stage === 1
                ? this.calculateOffsetDate(options.pushyaDate, -1)
                : options.pushyaDate);
        const whatsAppUrl = this.generateWhatsAppLink(options.phone, messageContent);
        return {
            patientId: options.patientId,
            patientName: options.patientName,
            phone: options.phone,
            pushyaDate: options.pushyaDate,
            stage: options.stage,
            scheduledDate,
            messageContent,
            whatsAppUrl,
            characterCount: messageContent.length,
        };
    }
    async sendWhatsApp(params) {
        const message = params.messageContent ||
            this.generateMessage(params.stage, params.patientName, params.pushyaDate, params.clinicInfo);
        const whatsAppUrl = this.generateWhatsAppLink(params.phone, message);
        const now = new Date();
        const sentTime = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v25.0';
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
        const isLiveConfigured = Boolean(phoneNumberId &&
            accessToken &&
            phoneNumberId !== 'your_meta_phone_number_id_here' &&
            accessToken !== 'your_meta_access_token_here');
        const isPhoneValid = Boolean(params.phone && params.phone.replace(/\D/g, '').length >= 10);
        if (!isPhoneValid) {
            return {
                reminderId: params.reminderId,
                patientId: params.patientId,
                patientName: params.patientName,
                phone: params.phone,
                pushyaDate: params.pushyaDate,
                stage: params.stage,
                status: 'failed',
                sentAt: sentTime,
                messageContent: message,
                whatsAppUrl,
                success: false,
                error: 'Invalid phone number format for WhatsApp delivery.',
            };
        }
        if (!params.simulateDelivery && isLiveConfigured) {
            try {
                const cleanDigits = params.phone.replace(/\D/g, '');
                const nationalNumber = cleanDigits.slice(-10);
                const countryCode = cleanDigits.length > 10 ? cleanDigits.slice(0, cleanDigits.length - 10) : '91';
                const fullRecipient = `${countryCode}${nationalNumber}`;
                console.log(`📡 [WhatsAppService] Dispatching Meta Cloud API message to +${fullRecipient}...`);
                const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || 'hello_world';
                const templateLang = process.env.WHATSAPP_TEMPLATE_LANG?.trim() || 'en_US';
                console.log(`📋 [WhatsAppService] Using Meta template: ${templateName} (${templateLang})`);
                const requestBody = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: fullRecipient,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: templateLang },
                    },
                };
                const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                const data = await response.json();
                if (!response.ok) {
                    const metaError = data?.error?.message || JSON.stringify(data);
                    console.error(`❌ [WhatsAppService] Meta API Error (${response.status}):`, metaError);
                    return {
                        reminderId: params.reminderId,
                        patientId: params.patientId,
                        patientName: params.patientName,
                        phone: params.phone,
                        pushyaDate: params.pushyaDate,
                        stage: params.stage,
                        status: 'failed',
                        sentAt: sentTime,
                        messageContent: message,
                        whatsAppUrl,
                        success: false,
                        error: `Meta API Error: ${metaError}`,
                    };
                }
                const messageId = data?.messages?.[0]?.id || 'unknown';
                console.log(`✅ [WhatsAppService] Meta message dispatched successfully (ID: ${messageId})`);
                return {
                    reminderId: params.reminderId,
                    patientId: params.patientId,
                    patientName: params.patientName,
                    phone: params.phone,
                    pushyaDate: params.pushyaDate,
                    stage: params.stage,
                    status: 'sent',
                    sentAt: sentTime,
                    messageContent: message,
                    whatsAppUrl,
                    success: true,
                };
            }
            catch (err) {
                console.error(`💥 [WhatsAppService] Network error during Meta dispatch:`, err.message);
                return {
                    reminderId: params.reminderId,
                    patientId: params.patientId,
                    patientName: params.patientName,
                    phone: params.phone,
                    pushyaDate: params.pushyaDate,
                    stage: params.stage,
                    status: 'failed',
                    sentAt: sentTime,
                    messageContent: message,
                    whatsAppUrl,
                    success: false,
                    error: `Network error: ${err.message}`,
                };
            }
        }
        console.log(`💬 [WhatsAppService] Click-to-Chat / Simulated delivery for ${params.patientName} (${params.phone})`);
        return {
            reminderId: params.reminderId,
            patientId: params.patientId,
            patientName: params.patientName,
            phone: params.phone,
            pushyaDate: params.pushyaDate,
            stage: params.stage,
            status: 'sent',
            sentAt: sentTime,
            messageContent: message,
            whatsAppUrl,
            success: true,
        };
    }
    calculateOffsetDate(dateStr, offsetDays) {
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                d.setDate(d.getDate() + offsetDays);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        }
        catch { }
        return dateStr;
    }
}
//# sourceMappingURL=whatsapp.service.js.map