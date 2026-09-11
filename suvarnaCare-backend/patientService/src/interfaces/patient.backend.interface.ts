export type StageDeliveryStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';

export interface IPatientSessionRecord {
  sessionDate?: string;
  attended: boolean;
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

export interface IPatientHistoryMap {
  [pushyaDate: string]: IPatientSessionRecord;
}

export interface IPatientEntity {
  id: string;
  name: string;
  birthDate: string;
  age?: string;
  phone: string;
  registrationDate: string;
  history: IPatientHistoryMap;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPatientDbRow {
  id: string;
  name: string;
  birth_date: string;
  phone: string;
  registration_date: string;
  pushya_date?: string;
  stage1_status?: string;
  stage1_at?: string;
  stage2_status?: string;
  stage2_at?: string;
  attended?: boolean | number;
  attended_at?: string;
  visited?: boolean | number;
  visited_at?: string;
  dose_administered?: boolean | number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPatientSessionHistoryDbRow {
  id: number;
  patient_id: string;
  pushya_date: string;
  stage1_status?: string;
  stage1_at?: string;
  stage2_status?: string;
  stage2_at?: string;
  attended?: boolean | number;
  attended_at?: string;
  visited?: boolean | number;
  visited_at?: string;
  dose_administered?: boolean | number;
  notes?: string;
  created_at: Date;
}

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  start: number;
  pageSize: number;
  page: number;
  totalPages: number;
}

export interface IPatientFilterQuery {
  search?: string;
  pushyaDate?: string;
  start?: number;
  pageSize?: number;
  page?: number;
  limit?: number;
  offset?: number;
}

