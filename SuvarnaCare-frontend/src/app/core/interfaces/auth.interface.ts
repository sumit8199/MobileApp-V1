export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  clinicName: string;
  qualification?: string;
  specialization?: string;
  registrationNo?: string;
  avatarUrl?: string;
  initials: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  createdAt: string;
  expiresAt: number;
  rememberMe: boolean;
}

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  clinicName: string;
  qualification?: string;
  specialization?: string;
  registrationNo?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}
