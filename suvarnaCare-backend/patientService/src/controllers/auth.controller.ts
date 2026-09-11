import { Request, Response } from 'express';
import { DoctorRepository } from '../repositories/doctor.repository.js';
import { IDoctorEntity, IDoctorResponseDto } from '../interfaces/doctor.backend.interface.js';
import { signJwtToken, verifyJwtToken } from '../middlewares/auth.middleware.js';
import { isSqlConnected } from '../database/sql-connection.js';
import { verifyPassword } from '../utils/password.util.js';

export class AuthController {
  private doctorRepository: DoctorRepository;

  constructor(doctorRepository = new DoctorRepository()) {
    this.doctorRepository = doctorRepository;
  }

  private toResponseDto(doctor: IDoctorEntity): IDoctorResponseDto {
    return {
      id: doctor.id,
      email: doctor.email,
      createdAt: doctor.createdAt,
    };
  }

  /**
   * POST /api/auth/login
   * Authenticates doctor credentials against the database using hashed password comparison
   * and returns a signed JWT token.
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, emailOrPhone, password, rememberMe } = req.body;
      const identifier = String(email || emailOrPhone || '').trim().toLowerCase();

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Query doctor from database table (only email & hashed password)
      let doctor = await this.doctorRepository.findByEmail(identifier);

      if (!doctor) {
        // Fallback for default demo doctor if DB was freshly started
        if (identifier === 'doctor@suvarnacare.com') {
          doctor = await this.doctorRepository.findById('usr_demo_001');
        }
        if (!doctor) {
          res.status(401).json({
            success: false,
            message: 'No doctor account found with this email.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Verify hashed password
      const isPasswordValid = verifyPassword(password, doctor.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid password. Please check your credentials.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Expiration: 30 days if rememberMe, else 7 days
      const expiresInSeconds = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

      const token = signJwtToken(
        {
          id: doctor.id,
          email: doctor.email,
          role: 'doctor',
        },
        expiresInSeconds
      );

      const userDto = this.toResponseDto(doctor);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: userDto,
        timestamp: new Date().toISOString(),
        databaseConnected: isSqlConnected(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed.',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * POST /api/auth/register
   * Registers a new doctor into the database storing ONLY email and hashed password,
   * and returns a signed JWT token.
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      // Simple email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (String(password).length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if email already registered in database
      const existing = await this.doctorRepository.findByEmail(normalizedEmail);
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'A doctor account with this email already exists. Please login.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Store only email and hashed password
      const createdDoctor = await this.doctorRepository.create({
        email: normalizedEmail,
        password: String(password),
      });

      const token = signJwtToken(
        {
          id: createdDoctor.id,
          email: createdDoctor.email,
          role: 'doctor',
        },
        30 * 24 * 60 * 60
      );

      const userDto = this.toResponseDto(createdDoctor);

      res.status(201).json({
        success: true,
        message: 'Your doctor account has been registered successfully.',
        token,
        user: userDto,
        timestamp: new Date().toISOString(),
        databaseConnected: isSqlConnected(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed.',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * GET/POST /api/auth/token
   * Generates a fresh signed JWT token for testing.
   */
  generateToken = async (_req: Request, res: Response): Promise<void> => {
    try {
      const demoDoctor = (await this.doctorRepository.findByEmail('doctor@suvarnacare.com')) || {
        id: 'usr_demo_001',
        email: 'doctor@suvarnacare.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      const token = signJwtToken(
        {
          id: demoDoctor.id,
          email: demoDoctor.email,
          role: 'doctor',
        },
        30 * 24 * 60 * 60
      );

      res.status(200).json({
        success: true,
        token,
        user: this.toResponseDto(demoDoctor),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * GET /api/auth/verify
   * Verifies the provided Bearer token and returns user details.
   */
  verify = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
      if (!authHeader) {
        res.status(401).json({ success: false, message: 'Missing Authorization header.' });
        return;
      }
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const result = verifyJwtToken(token);
      if (!result.valid) {
        res.status(401).json({ success: false, message: result.error || 'Invalid token.' });
        return;
      }
      res.status(200).json({
        success: true,
        valid: true,
        user: result.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
