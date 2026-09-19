import {
  ReminderStage,
  ReminderStatus,
  IClinicInfo,
  IWhatsAppMessageTemplate,
  IWhatsAppPreviewResult,
  IWhatsAppSendResult,
} from '../interfaces/reminder.backend.interface.js';

export class WhatsAppService {
  private defaultClinicInfo: IClinicInfo = {
    clinicName: process.env.CLINIC_NAME || 'Mauli Clinic',
    doctorName: process.env.DOCTOR_NAME || 'Dr. Suraj Yeole',
    doctorQualification: process.env.DOCTOR_QUALIFICATION || 'BAMS, MD (Pediatrics)',
    phone: process.env.CLINIC_PHONE || '+91 9767976136',
    address: process.env.CLINIC_ADDRESS || 'Mauli Clinic & Child Wellness Center, Nashik.',
    timings: process.env.CLINIC_TIMINGS || '09:00 AM - 01:00 PM & 05:00 PM - 08:30 PM',
  };

  /**
   * Returns standard templates for Pushya WhatsApp reminders.
   */
  getTemplates(): IWhatsAppMessageTemplate[] {
    return [
      {
        stage: 1,
        title: 'Pushyamrut Advance Alert (1 Day Before)',
        description: 'Sent 1 day prior to the Pushya Nakshatra date to help parents prepare and bring their child tomorrow.',
        timingDescription: '1 Day Before Pushya Date (Reminder Fire Date)',
        template:
          '🌿 *SUVARNA PRASHAN REMINDER* 🌿\n\n' +
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

  /**
   * Formats ISO date (YYYY-MM-DD) into readable format (e.g., "Saturday, 18 Jul 2026").
   */
  formatPushyaDate(dateStr: string): string {
    if (!dateStr) return '';
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
    } catch { }
    return dateStr;
  }

  /**
   * Generates WhatsApp message content using stage template and parameters.
   */
  generateMessage(
    stage: ReminderStage,
    patientName: string,
    pushyaDate: string,
    clinicInfo?: Partial<IClinicInfo>
  ): string {
    const info: IClinicInfo = { ...this.defaultClinicInfo, ...clinicInfo };
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

  /**
   * Generates a standard WhatsApp click-to-chat deep-link (wa.me).
   */
  generateWhatsAppLink(phone: string, message: string): string {
    const cleanDigits = phone.replace(/\D/g, '');
    const nationalNumber = cleanDigits.slice(-10);
    const countryCode = cleanDigits.length > 10 ? cleanDigits.slice(0, cleanDigits.length - 10) : '91';
    const fullPhone = `${countryCode}${nationalNumber}`;
    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${fullPhone}?text=${encodedText}`;
  }

  /**
   * Previews WhatsApp message for a given patient, date, and stage.
   */
  previewMessage(options: {
    patientId?: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    scheduledDate?: string;
    clinicInfo?: Partial<IClinicInfo>;
  }): IWhatsAppPreviewResult {
    const messageContent = this.generateMessage(
      options.stage,
      options.patientName,
      options.pushyaDate,
      options.clinicInfo
    );

    const scheduledDate =
      options.scheduledDate ||
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

  /**
   * Sends a WhatsApp message using Meta WhatsApp Cloud API (if configured) or generates Click-to-Chat URL.
   */
  async sendWhatsApp(params: {
    reminderId: string;
    patientId: string;
    patientName: string;
    phone: string;
    pushyaDate: string;
    stage: ReminderStage;
    messageContent?: string;
    simulateDelivery?: boolean;
    clinicInfo?: Partial<IClinicInfo>;
  }): Promise<IWhatsAppSendResult> {
    const message =
      params.messageContent ||
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

    const isLiveConfigured = Boolean(
      phoneNumberId &&
      accessToken &&
      phoneNumberId !== 'your_meta_phone_number_id_here' &&
      accessToken !== 'your_meta_access_token_here'
    );

    // If simulateDelivery is explicitly true, or phone is invalid
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

    // Live Meta Cloud API Dispatch
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

        const data: any = await response.json();

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
      } catch (err: any) {
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

    // Default / Simulated / Deep Link mode (when credentials are placeholders or simulateDelivery is true)
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

  /**
   * Helper to calculate offset date string (YYYY-MM-DD).
   */
  calculateOffsetDate(dateStr: string, offsetDays: number): string {
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
    } catch { }
    return dateStr;
  }

  /**
   * Verifies Meta Cloud API Webhook handshake challenge.
   */
  verifyWebhook(mode?: string, token?: string, challenge?: string): { success: boolean; challenge?: string } {
    const expectedToken = (process.env.WHATSAPP_VERIFY_TOKEN || 'suvarnacare_webhook_secret_2026').trim();
    if (mode === 'subscribe' && token && token.trim() === expectedToken) {
      return { success: true, challenge };
    }
    return { success: false };
  }

  /**
   * Handles incoming Meta WhatsApp Webhook events (delivery receipts, message status, and user replies).
   */
  async processWebhookEvent(body: any, repository?: any): Promise<void> {
    if (!body || body.object !== 'whatsapp_business_account') {
      return;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // 1. Message Status Updates (sent, delivered, read, failed)
        if (Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const { id: messageId, status, recipient_id, timestamp, errors } = statusObj;
            console.log(`📊 [Meta Webhook Status] Message ${messageId} to ${recipient_id} -> ${status?.toUpperCase()} (timestamp: ${timestamp})`);
            if (errors && errors.length > 0) {
              console.warn(`⚠️ [Meta Webhook Status Error]:`, JSON.stringify(errors));
            }
            if (repository && typeof repository.addLog === 'function') {
              try {
                await repository.addLog(
                  'SYSTEM',
                  `WHATSAPP_MSG_${(status || 'UNKNOWN').toUpperCase()}`,
                  `Recipient: ${recipient_id}, Status: ${status}, MsgId: ${messageId}`
                );
              } catch (logErr: any) {
                console.warn('⚠️ [WhatsAppService] Failed to record webhook audit log:', logErr.message);
              }
            }
          }
        }

        // 2. Incoming messages from users
        if (Array.isArray(value.messages)) {
          for (const msg of value.messages) {
            const { from, id: messageId, type, text, timestamp } = msg;
            const messageBody = type === 'text' ? text?.body : `[${type} message]`;
            console.log(`💬 [Meta Webhook Incoming Message] From ${from} (MsgId: ${messageId}): "${messageBody}" at ${timestamp}`);
            if (repository && typeof repository.addLog === 'function') {
              try {
                await repository.addLog(
                  'SYSTEM',
                  'WHATSAPP_INCOMING_MESSAGE',
                  `From: ${from}, Content: ${messageBody}, MsgId: ${messageId}`
                );
              } catch (logErr: any) {
                console.warn('⚠️ [WhatsAppService] Failed to record incoming message log:', logErr.message);
              }
            }
          }
        }
      }
    }
  }
}

