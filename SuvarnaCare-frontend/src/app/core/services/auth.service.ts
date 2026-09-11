import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, delay, map, catchError } from 'rxjs';
import {
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@core/interfaces';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from './local-storage.service';

const STORAGE_KEY_TOKEN = 'suvarna_token';
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
  private http = inject(HttpClient);
  private storage = inject(LocalStorageService);
  private router = inject(Router);
  private authApiUrl = environment.authApiUrl || 'http://localhost:5001/api/auth';

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
      // Ensure token is synced into localStorage
      if (session.token && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_TOKEN, session.token);
      }
      this.currentUser.set(session.user);
    } else if (session && session.expiresAt <= Date.now()) {
      this.clearStorageSession();
      this.currentUser.set(null);
    }
  }

  /**
   * Cleans up both token and session from localStorage
   */
  private clearStorageSession(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
    this.storage.removeItem(STORAGE_KEY_SESSION);
  }

  /**
   * Retrieves active JWT token from localStorage or session storage
   */
  public getToken(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const directToken = window.localStorage.getItem(STORAGE_KEY_TOKEN);
      if (directToken) {
        return directToken;
      }
    }
    const session = this.storage.getItem<AuthSession>(STORAGE_KEY_SESSION);
    if (session && session.token) {
      return session.token;
    }
    return '';
  }

  /**
   * Helper to extract initials from doctor/user name or email
   */
  public generateInitials(nameOrEmail?: string): string {
    if (!nameOrEmail) return 'DR';
    const cleanName = nameOrEmail.replace(/^(Dr\.|Doctor|Vaidya|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    if (cleanName.includes('@')) {
      const prefix = cleanName.split('@')[0];
      return prefix.substring(0, 2).toUpperCase();
    }
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return 'DR';
  }

  /**
   * Retrieve all registered users from local storage
   */
  public getRegisteredUsers(): User[] {
    return this.storage.getItem<User[]>(STORAGE_KEY_USERS, []) || [];
  }

  /**
   * Formats user entity ensuring fallback initials and display values
   */
  private enrichUser(user: User): User {
    return {
      ...user,
      initials: user.initials || this.generateInitials(user.name || user.email),
      name: user.name || (user.email ? `Dr. ${user.email.split('@')[0]}` : 'Doctor'),
    };
  }

  /**
   * Register a new user via backend POST /api/auth/register (with offline fallback)
   */
  public register(data: RegisterData): Observable<AuthResponse> {
    this.isLoading.set(true);

    return this.http.post<AuthResponse>(`${this.authApiUrl}/register`, data).pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res && res.success && res.token && res.user) {
          const enrichedUser = this.enrichUser({
            ...res.user,
            name: data.name || res.user.name,
            clinicName: data.clinicName || res.user.clinicName,
            phone: data.phone || res.user.phone,
            qualification: data.qualification || res.user.qualification,
            specialization: data.specialization || res.user.specialization,
            registrationNo: data.registrationNo || res.user.registrationNo,
          });

          // Store JWT directly in localStorage
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
          }

          const session: AuthSession = {
            user: enrichedUser,
            token: res.token,
            createdAt: new Date().toISOString(),
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            rememberMe: true,
          };
          this.storage.setItem(STORAGE_KEY_SESSION, session);
          this.currentUser.set(enrichedUser);

          // Update local registered cache
          const users = this.getRegisteredUsers();
          users.push(enrichedUser);
          this.storage.setItem(STORAGE_KEY_USERS, users);
        }
        return res;
      }),
      catchError((err) => {
        console.warn('⚠️ [AuthService] Backend register failed, applying local fallback:', err?.error?.message || err.message);
        this.isLoading.set(false);
        return this.registerLocally(data);
      })
    );
  }

  /**
   * Login with email and password via backend POST /api/auth/login (with offline fallback)
   */
  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.isLoading.set(true);

    const payload = {
      email: credentials.email || credentials.emailOrPhone,
      emailOrPhone: credentials.emailOrPhone || credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    };

    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, payload).pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res && res.success && res.token && res.user) {
          const sessionExpiresIn = credentials.rememberMe
            ? 30 * 24 * 60 * 60 * 1000 // 30 days
            : 24 * 60 * 60 * 1000; // 1 day

          const enrichedUser = this.enrichUser(res.user);

          // Store JWT token directly in localStorage
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
          }

          const session: AuthSession = {
            user: enrichedUser,
            token: res.token,
            createdAt: new Date().toISOString(),
            expiresAt: Date.now() + sessionExpiresIn,
            rememberMe: !!credentials.rememberMe,
          };
          this.storage.setItem(STORAGE_KEY_SESSION, session);

          const identifier = credentials.email || credentials.emailOrPhone || '';
          if (credentials.rememberMe && identifier) {
            this.storage.setItem(STORAGE_KEY_REMEMBERED, identifier);
          } else {
            this.storage.removeItem(STORAGE_KEY_REMEMBERED);
          }

          this.currentUser.set(enrichedUser);
        }
        return res;
      }),
      catchError((err) => {
        console.warn('⚠️ [AuthService] Backend login error, applying local fallback:', err?.error?.message || err.message);
        this.isLoading.set(false);
        return this.loginLocally(credentials);
      })
    );
  }

  /**
   * Local fallback registration
   */
  private registerLocally(data: RegisterData): Observable<AuthResponse> {
    const users = this.getRegisteredUsers();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return of({
        success: false,
        message: 'An account with this email address already exists. Please login instead.',
      }).pipe(delay(300));
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name?.trim() || `Dr. ${normalizedEmail.split('@')[0]}`,
      email: normalizedEmail,
      phone: data.phone?.trim() || '',
      password: data.password,
      clinicName: data.clinicName?.trim() || 'Ayurveda Wellness Center',
      qualification: data.qualification?.trim() || 'BAMS, MD (Ayurveda)',
      specialization: data.specialization?.trim() || 'Ayurvedic Practitioner',
      registrationNo: data.registrationNo?.trim() || `AYUSH/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      initials: this.generateInitials(data.name || normalizedEmail),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.storage.setItem(STORAGE_KEY_USERS, users);

    const token = `jwt_suvarna_token_${Date.now()}`;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }

    const session: AuthSession = {
      user: newUser,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
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
   * Local fallback login
   */
  private loginLocally(credentials: LoginCredentials): Observable<AuthResponse> {
    const users = this.getRegisteredUsers();
    const query = (credentials.email || credentials.emailOrPhone || '').trim().toLowerCase();

    const user = users.find(
      (u) =>
        (u.email.toLowerCase() === query || (u.phone && u.phone.toLowerCase() === query)) &&
        u.password === credentials.password
    );

    if (!user) {
      return of({
        success: false,
        message: 'Invalid email/phone or password. Please verify your credentials and try again.',
      }).pipe(delay(300));
    }

    user.lastLoginAt = new Date().toISOString();
    this.storage.setItem(STORAGE_KEY_USERS, users);

    const sessionExpiresIn = credentials.rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    const token = `jwt_suvarna_token_${Date.now()}`;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }

    const session: AuthSession = {
      user,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + sessionExpiresIn,
      rememberMe: !!credentials.rememberMe,
    };
    this.storage.setItem(STORAGE_KEY_SESSION, session);

    const identifier = credentials.email || credentials.emailOrPhone || '';
    if (credentials.rememberMe && identifier) {
      this.storage.setItem(STORAGE_KEY_REMEMBERED, identifier);
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
   * Log out active user and clear token + session from localStorage
   */
  public logout(): void {
    this.clearStorageSession();
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
      name: DEFAULT_DEMO_USER.name || 'Dr. Meera Vaidya',
    };
  }
}
