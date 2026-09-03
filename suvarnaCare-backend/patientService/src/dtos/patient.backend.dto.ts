import {
  IPatientEntity,
  IPatientHistoryMap,
  IPatientSessionRecord,
  StageDeliveryStatus,
} from '../interfaces/patient.backend.interface.js';

/**
 * Calculates human-readable pediatric age from birth date (e.g. '18 mo', '2 yrs', '2 yrs 3 mo', '8 mo').
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

export interface CreatePatientRequestDto {
  name: string;
  birthDate?: string;
  phone: string;
  registrationDate?: string;
  initialPushyaDate?: string;
}

export interface UpdatePatientRequestDto {
  name?: string;
  birthDate?: string;
  phone?: string;
  registrationDate?: string;
}

export interface AddSessionHistoryRequestDto {
  pushyaDate: string;
  sessionDate?: string;
  attended?: boolean;
  attendedAt?: string;
  visited?: boolean;
  visitedAt?: string;
  doseAdministered?: boolean;
  notes?: string;
  stage1Status?: StageDeliveryStatus | string;
  stage1At?: string;
  stage2Status?: StageDeliveryStatus | string;
  stage2At?: string;
}

export interface PatientResponseDto {
  id: string;
  name: string;
  birthDate: string;
  age: string;
  phone: string;
  registrationDate: string;
  history: IPatientHistoryMap;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  databaseConnected?: boolean;
}

export function buildCreatePatientDto(raw: any): CreatePatientRequestDto {
  // Support both birthDate and fallback if client sent age
  let birthDate = raw.birthDate || raw.birth_date || '';
  if (!birthDate && raw.age) {
    // If client supplied age string like '2 yrs', estimate birth date
    const years = parseInt(raw.age) || 2;
    const est = new Date();
    est.setFullYear(est.getFullYear() - years);
    birthDate = est.toISOString().split('T')[0];
  }

  return {
    name: String(raw.name || '').trim(),
    birthDate: String(birthDate || '').trim(),
    phone: String(raw.phone || '').replace(/\D/g, '').slice(0, 10),
    registrationDate: raw.registrationDate || raw.registration_date || new Date().toISOString().split('T')[0],
    initialPushyaDate: raw.nextPushya || raw.initialPushyaDate,
  };
}

export function buildUpdatePatientDto(raw: any): UpdatePatientRequestDto {
  const dto: UpdatePatientRequestDto = {};
  if (raw.name !== undefined) dto.name = String(raw.name).trim();
  if (raw.birthDate !== undefined || raw.birth_date !== undefined) {
    dto.birthDate = String(raw.birthDate || raw.birth_date || '').trim();
  }
  if (raw.phone !== undefined) dto.phone = String(raw.phone).replace(/\D/g, '').slice(0, 10);
  if (raw.registrationDate !== undefined || raw.registration_date !== undefined) {
    dto.registrationDate = String(raw.registrationDate || raw.registration_date).trim();
  }
  return dto;
}

export function toPatientResponseDto(entity: IPatientEntity): PatientResponseDto {
  const computedAge = calculateAge(entity.birthDate) || entity.age || '';
  return {
    id: entity.id,
    name: entity.name,
    birthDate: entity.birthDate || '',
    age: computedAge,
    phone: entity.phone,
    registrationDate: entity.registrationDate,
    history: entity.history || {},
  };
}

export function toPatientListResponseDto(entities: IPatientEntity[]): PatientResponseDto[] {
  return entities.map(toPatientResponseDto);
}

export function buildApiResponse<T>(
  data: T,
  message = 'Success',
  databaseConnected = true
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    databaseConnected,
  };
}
