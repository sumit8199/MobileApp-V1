export type StageStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';

export interface PatientHistoryRecord {
  sessionDate?: string;
  attended?: boolean;
  attendedAt?: string;
  visited?: boolean;
  visitedAt?: string;
  doseAdministered?: boolean;
  notes?: string;
  stage1Status?: StageStatus | string;
  stage1At?: string;
  stage2Status?: StageStatus | string;
  stage2At?: string;
}

export type PatientSessionMap = Record<string, PatientHistoryRecord>;

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  age?: string;
  parentName: string;
  phone: string;
  registrationDate: string;
  history: PatientSessionMap;
}

export interface PatientForm {
  name: string;
  birthDate: string;
  parentName: string;
  phone: string;
  registrationDate: string;
}

export interface FormErrors {
  name?: string;
  birthDate?: string;
  age?: string;
  parentName?: string;
  phone?: string;
  registrationDate?: string;
}

export interface PatientFilter {
  search?: string;
  pushyaDate?: string;
  limit?: number;
}
