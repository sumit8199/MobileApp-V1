export interface IDoctorEntity {
  id: string;
  email: string;
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IDoctorDbRow {
  id: string;
  email: string;
  password?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ICreateDoctorDto {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  clinicName?: string;
  qualification?: string;
  specialization?: string;
  registrationNo?: string;
  role?: string;
}

export interface IDoctorResponseDto {
  id: string;
  email: string;
  createdAt: string;
}
