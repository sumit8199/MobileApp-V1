import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, delay } from 'rxjs';
import {
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@core/interfaces';
import { LocalStorageService } from './local-storage.service';

const STORAGE_KEY_USERS = 'suvarna_registered_users';
const STORAGE_KEY_SESSION = 'suvarna_auth_session';
const STORAGE_KEY_REMEMBERED = 'suvarna_remembered_identifier';

const DEFAULT_DEMO_USER: User = {
  id: 'usr_demo_001',
  name: 'Dr. Meera Vaidya',
  email: 'doctor@suvarnacare.com',
  phone: '9876500000',
  password: 'Password@123',
  clinicName: 'Vaidya Ayurveda Clinic & Child Wellness Center',
  qualification: 'BAMS, MD (Ayurveda)',
  specialization: 'Suvarna Prashan & Pediatric Ayurveda Specialist',
  registrationNo: 'AYUSH/MH/2014/0042',
  initials: 'MV',
  createdAt: new Date().toISOString(),
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private storage = inject(LocalStorageService);
  private router = inject(Router);

  // Reactive state using Angular Signals
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser());
  public isLoading = signal<boolean>(false);

  constructor() {
    this.seedDefaultUsersIfEmpty();
    this.restoreSession();
  }

  /**
   * Ensure default demo user exists for seamless evaluation & offline testing
   */
  private seedDefaultUsersIfEmpty(): void {
    const existingUsers = this.storage.getItem<User[]>(STORAGE_KEY_USERS, []);
    if (!existingUsers || existingUsers.length === 0) {
      this.storage.setItem(STORAGE_KEY_USERS, [DEFAULT_DEMO_USER]);
    }
  }

  /**
   * Restore previous active session from local storage if valid
   */
  private restoreSession(): void {
    const session = this.storage.getItem<AuthSession>(STORAGE_KEY_SESSION);
    if (session && session.user && session.expiresAt > Date.now()) {
      this.currentUser.set(session.user);
    } else if (session && session.expiresAt <= Date.now()) {
      this.storage.removeItem(STORAGE_KEY_SESSION);
      this.currentUser.set(null);
    }
  }

  /**
   * Helper to extract initials from doctor/user name
   */
  public generateInitials(name: string): string {
    if (!name) return 'SC';
    const cleanName = name.replace(/^(Dr\.|Doctor|Vaidya|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return 'SC';
  }

  /**
   * Retrieve all registered users from local storage
   */
  public getRegisteredUsers(): User[] {
    return this.storage.getItem<User[]>(STORAGE_KEY_USERS, []) || [];
  }

  /**
   * Register a new user in Ionic local storage
   */
  public register(data: RegisterData): Observable<AuthResponse> {
    const users = this.getRegisteredUsers();
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = data.phone.trim();

    // Check if email already exists
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (emailExists) {
      return of({
        success: false,
        message: 'An account with this email address already exists. Please login instead.',
      }).pipe(delay(300));
    }

    // Check if phone already exists
    const phoneExists = users.some(
      (u) => u.phone === normalizedPhone
    );
    if (phoneExists) {
      return of({
        success: false,
        message: 'An account with this phone number already exists.',
      }).pipe(delay(300));
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: data.password,
      clinicName: data.clinicName.trim(),
      qualification: data.qualification?.trim() || 'BAMS, MD (Ayurveda)',
      specialization: data.specialization?.trim() || 'Ayurvedic Practitioner',
      registrationNo: data.registrationNo?.trim() || `AYUSH/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      initials: this.generateInitials(data.name),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Save to local storage
    users.push(newUser);
    this.storage.setItem(STORAGE_KEY_USERS, users);

    // Auto-create active session and login
    const session: AuthSession = {
      user: newUser,
      token: `jwt_suvarna_token_${Date.now()}`,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      rememberMe: true,
    };
    this.storage.setItem(STORAGE_KEY_SESSION, session);
    this.currentUser.set(newUser);

    return of({
      success: true,
      message: `Welcome Dr. ${newUser.name}! Your account has been registered successfully.`,
      user: newUser,
      token: session.token,
    }).pipe(delay(350));
  }

  /**
   * Login with email/phone and password
   */
  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    const users = this.getRegisteredUsers();
    const query = credentials.emailOrPhone.trim().toLowerCase();

    const user = users.find(
      (u) =>
        (u.email.toLowerCase() === query || u.phone.toLowerCase() === query) &&
        u.password === credentials.password
    );

    if (!user) {
      return of({
        success: false,
        message: 'Invalid email/phone or password. Please verify your credentials and try again.',
      }).pipe(delay(300));
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    this.storage.setItem(STORAGE_KEY_USERS, users);

    // Create session
    const sessionExpiresIn = credentials.rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 24 * 60 * 60 * 1000; // 1 day

    const session: AuthSession = {
      user,
      token: `jwt_suvarna_token_${Date.now()}`,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + sessionExpiresIn,
      rememberMe: !!credentials.rememberMe,
    };
    this.storage.setItem(STORAGE_KEY_SESSION, session);

    // Manage remembered identifier
    if (credentials.rememberMe) {
      this.storage.setItem(STORAGE_KEY_REMEMBERED, credentials.emailOrPhone);
    } else {
      this.storage.removeItem(STORAGE_KEY_REMEMBERED);
    }

    this.currentUser.set(user);

    return of({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user,
      token: session.token,
    }).pipe(delay(300));
  }

  /**
   * Log out active user and clear session
   */
  public logout(): void {
    this.storage.removeItem(STORAGE_KEY_SESSION);
    this.currentUser.set(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Update active user profile details in local storage
   */
  public updateProfile(updates: Partial<User>): Observable<User | null> {
    const current = this.currentUser();
    if (!current) return of(null);

    const users = this.getRegisteredUsers();
    const index = users.findIndex((u) => u.id === current.id);

    const updatedUser: User = {
      ...current,
      ...updates,
      initials: updates.name ? this.generateInitials(updates.name) : current.initials,
    };

    if (index !== -1) {
      users[index] = updatedUser;
      this.storage.setItem(STORAGE_KEY_USERS, users);
    }

    // Update active session
    const session = this.storage.getItem<AuthSession>(STORAGE_KEY_SESSION);
    if (session) {
      session.user = updatedUser;
      this.storage.setItem(STORAGE_KEY_SESSION, session);
    }

    this.currentUser.set(updatedUser);
    return of(updatedUser);
  }

  /**
   * Get remembered identifier if previously selected
   */
  public getRememberedIdentifier(): string {
    return this.storage.getItem<string>(STORAGE_KEY_REMEMBERED, '') || '';
  }

  /**
   * Get default demo credentials helper
   */
  public getDemoCredentials(): { email: string; password: string; name: string } {
    return {
      email: DEFAULT_DEMO_USER.email,
      password: DEFAULT_DEMO_USER.password || 'Password@123',
      name: DEFAULT_DEMO_USER.name,
    };
  }
}
