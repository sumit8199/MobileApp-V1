import { Patient, PatientForm } from '../interfaces/patient.interface';
import { Reminder, ReminderStatus, ReminderStage, PushyaSchedule } from '../interfaces/reminder.interface';
import {
  CreatePatientRequestDto,
  UpdatePatientRequestDto,
  AddSessionHistoryRequestDto,
  PatientResponseDto,
} from './patient.dto';
import {
  CreateReminderRequestDto,
  UpdateReminderStatusDto,
  ReminderResponseDto,
  PushyaScheduleResponseDto,
  SyncPatientsRequestDto,
} from './reminder.dto';

// =============================================================
// UTILITY: DYNAMIC AGE CALCULATION
// =============================================================

/**
 * Calculates human-readable pediatric age from birth date string (YYYY-MM-DD).
 * Examples: '18 mo', '2 yrs', '2 yrs 3 mo', '8 mo', '1 yr', '23 days'.
 */
export function calculateAge(birthDateStr: string | Date): string {
  if (!birthDateStr) return '';
  const dob = new Date(birthDateStr);
  if (isNaN(dob.getTime())) return '';

  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  const days = today.getDate() - dob.getDate();

  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return 'Just born';
  if (years === 0) {
    if (months === 0) {
      const diffDays = Math.max(0, Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)));
      return diffDays === 1 ? '1 day' : `${diffDays} days`;
    }
    return months === 1 ? '1 mo' : `${months} mo`;
  }
  if (years === 1 && months === 0) return '1 yr';
  if (months === 0) return `${years} yrs`;
  if (years < 3) return `${years} yr${years > 1 ? 's' : ''} ${months} mo`;
  return `${years} yrs`;
}

// =============================================================
// PATIENT DTO BUILDERS
// =============================================================

/**
 * Builds a sanitized CreatePatientRequestDto from the frontend PatientForm.
 */
export function buildCreatePatientDto(
  form: PatientForm,
  nextPushyaDate?: string
): CreatePatientRequestDto {
  const sanitizedPhone = (form.phone || '').replace(/\D/g, '').slice(0, 10);
  const regDate = form.registrationDate || new Date().toISOString().split('T')[0];

  return {
    name: form.name.trim(),
    birthDate: form.birthDate.trim(),
    parentName: form.parentName.trim(),
    phone: sanitizedPhone,
    registrationDate: regDate,
    initialPushyaDate: nextPushyaDate,
  };
}

/**
 * Builds an UpdatePatientRequestDto from a partial form state.
 */
export function buildUpdatePatientDto(
  form: Partial<PatientForm>
): UpdatePatientRequestDto {
  const dto: UpdatePatientRequestDto = {};
  if (form.name !== undefined) dto.name = form.name.trim();
  if (form.birthDate !== undefined) dto.birthDate = form.birthDate.trim();
  if (form.parentName !== undefined) dto.parentName = form.parentName.trim();
  if (form.phone !== undefined) {
    dto.phone = form.phone.replace(/\D/g, '').slice(0, 10);
  }
  if (form.registrationDate !== undefined) {
    dto.registrationDate = form.registrationDate;
  }
  return dto;
}

/**
 * Transforms a backend PatientResponseDto into a frontend Patient UI model with computed age.
 */
export function buildPatientViewModel(dto: PatientResponseDto): Patient {
  const computedAge = calculateAge(dto.birthDate) || dto.age || '';
  return {
    id: dto.id,
    name: dto.name,
    birthDate: dto.birthDate || '',
    age: computedAge,
    parentName: dto.parentName,
    phone: dto.phone,
    registrationDate: dto.registrationDate,
    history: dto.history || {},
  };
}

/**
 * Transforms an array of backend PatientResponseDtos into frontend Patient UI models.
 */
export function buildPatientListViewModel(dtos: PatientResponseDto[]): Patient[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(buildPatientViewModel);
}

/**
 * Converts a Patient entity into initial PatientForm values for editing.
 */
export function buildPatientFormDto(patient: Patient): PatientForm {
  return {
    name: patient.name,
    birthDate: patient.birthDate,
    parentName: patient.parentName,
    phone: patient.phone,
    registrationDate: patient.registrationDate,
  };
}

/**
 * Builds an AddSessionHistoryRequestDto for recording a Pushya dose.
 */
export function buildAddSessionHistoryDto(
  pushyaDate: string,
  attended?: boolean,
  attendedAt?: string,
  doseAdministered?: boolean,
  notes?: string
): AddSessionHistoryRequestDto {
  return {
    pushyaDate,
    sessionDate: pushyaDate,
    attended,
    attendedAt,
    visited: attended,
    visitedAt: attendedAt,
    doseAdministered,
    notes,
  };
}

// =============================================================
// REMINDER DTO BUILDERS
// =============================================================

/**
 * Builds a CreateReminderRequestDto from patient and schedule parameters.
 */
export function buildCreateReminderDto(
  patient: Patient,
  pushyaDate: string,
  stage: ReminderStage,
  scheduledDate: string,
  messageContent?: string
): CreateReminderRequestDto {
  return {
    patientId: patient.id,
    patientName: patient.name,
    phone: patient.phone,
    pushyaDate,
    stage,
    scheduledDate,
    messageContent,
  };
}

/**
 * Builds an UpdateReminderStatusDto with auto timestamp.
 */
export function buildUpdateReminderStatusDto(
  status: ReminderStatus,
  customTimestamp?: string
): UpdateReminderStatusDto {
  const timestampStr =
    customTimestamp ||
    new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return {
    status,
    timestampStr,
  };
}

/**
 * Maps a backend ReminderResponseDto to a frontend Reminder UI model.
 */
export function buildReminderViewModel(dto: ReminderResponseDto): Reminder {
  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName,
    phone: dto.phone,
    pushyaDate: dto.pushyaDate,
    stage: dto.stage,
    scheduledDate: dto.scheduledDate,
    status: dto.status,
    sentAt: dto.sentAt,
    deliveredAt: dto.deliveredAt,
    readAt: dto.readAt,
    messageContent: dto.messageContent,
    whatsAppUrl: dto.whatsAppUrl,
  };
}

/**
 * Maps an array of backend ReminderResponseDtos to frontend Reminder UI models.
 */
export function buildReminderListViewModel(dtos: ReminderResponseDto[]): Reminder[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(buildReminderViewModel);
}

/**
 * Maps a PushyaScheduleResponseDto to PushyaSchedule model.
 */
export function buildPushyaScheduleViewModel(dto: PushyaScheduleResponseDto): PushyaSchedule {
  return {
    pushyaDate: dto.pushyaDate,
    stage1FireDate: dto.stage1FireDate,
    stage2FireDate: dto.stage2FireDate,
    label: dto.label,
    isActive: dto.isActive,
  };
}

/**
 * Builds SyncPatientsRequestDto from a list of frontend patients.
 */
export function buildSyncPatientsDto(
  pushyaDate: string,
  patients: Patient[]
): SyncPatientsRequestDto {
  return {
    pushyaDate,
    patients: patients.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
    })),
  };
}
