import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LocalStorageService } from './local-storage.service';

describe('AuthService & LocalStorage Flow', () => {
  let authService: AuthService;
  let storageService: LocalStorageService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    // Clear localStorage before each test
    window.localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        LocalStorageService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    storageService = TestBed.inject(LocalStorageService);
    authService = TestBed.inject(AuthService);
  });

  it('should initialize with default demo user in storage', () => {
    const users = authService.getRegisteredUsers();
    expect(users.length).toBeGreaterThanOrEqual(1);
    expect(users[0].email).toBe('doctor@suvarnacare.com');
  });

  it('should successfully login with valid demo credentials', (done) => {
    authService.login({
      emailOrPhone: 'doctor@suvarnacare.com',
      password: 'Password@123',
      rememberMe: true,
    }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.user?.name).toBe('Dr. Meera Vaidya');
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.currentUser()?.email).toBe('doctor@suvarnacare.com');
      done();
    });
  });

  it('should fail login with wrong password', (done) => {
    authService.login({
      emailOrPhone: 'doctor@suvarnacare.com',
      password: 'wrongpassword',
    }).subscribe((res) => {
      expect(res.success).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
      done();
    });
  });

  it('should register a new doctor, persist to local storage, and auto-login', (done) => {
    authService.register({
      name: 'Dr. Anand Joshi',
      email: 'anand.joshi@ayurveda.in',
      phone: '9823098230',
      clinicName: 'Joshi Ayurvedic Sansthan',
      qualification: 'BAMS, MD',
      specialization: 'Kaumarbhritya / Child Health',
      registrationNo: 'AYUSH/MH/2020/5512',
      password: 'NewSecurePassword@123',
    }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.user?.name).toBe('Dr. Anand Joshi');
      expect(res.user?.initials).toBe('AJ');
      expect(authService.isAuthenticated()).toBe(true);

      // Verify persistence in local storage
      const storedUsers = authService.getRegisteredUsers();
      const found = storedUsers.find((u) => u.email === 'anand.joshi@ayurveda.in');
      expect(found).toBeDefined();
      expect(found?.clinicName).toBe('Joshi Ayurvedic Sansthan');
      done();
    });
  });

  it('should reject registration if email already exists', (done) => {
    authService.register({
      name: 'Duplicate Doctor',
      email: 'doctor@suvarnacare.com',
      phone: '9999999999',
      clinicName: 'Duplicate Clinic',
      password: 'Password@123',
    }).subscribe((res) => {
      expect(res.success).toBe(false);
      expect(res.message).toContain('already exists');
      done();
    });
  });

  it('should properly log out, clear session, and navigate to /login', () => {
    // First login
    authService.login({
      emailOrPhone: 'doctor@suvarnacare.com',
      password: 'Password@123',
    }).subscribe();

    expect(authService.isAuthenticated()).toBe(true);

    // Now logout
    authService.logout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.currentUser()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
