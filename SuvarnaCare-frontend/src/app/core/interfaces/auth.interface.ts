export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  password?: string;
  clinicName?: string;
  qualification?: string;
  specialization?: string;
  registrationNo?: string;
  avatarUrl?: string;
  initials?: string;
  createdAt?: string;
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
  email?: string;
  emailOrPhone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  clinicName?: string;
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
