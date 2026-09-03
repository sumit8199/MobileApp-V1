import { PatientHistoryRecord } from '../interfaces/patient.interface';

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
  stage1Status?: string;
  stage1At?: string;
  stage2Status?: string;
  stage2At?: string;
}

export interface PatientResponseDto {
  id: string;
  name: string;
  birthDate: string;
  age: string;
  phone: string;
  registrationDate: string;
  history: Record<string, PatientHistoryRecord>;
}

export interface PatientFilterDto {
  search?: string;
  pushyaDate?: string;
  limit?: number;
  offset?: number;
}
