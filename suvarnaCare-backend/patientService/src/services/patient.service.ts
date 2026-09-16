import { PatientRepository } from '../repositories/patient.repository.js';
import {
  CreatePatientRequestDto,
  UpdatePatientRequestDto,
  AddSessionHistoryRequestDto,
  PatientResponseDto,
  buildCreatePatientDto,
  buildUpdatePatientDto,
  toPatientResponseDto,
  toPatientListResponseDto,
} from '../dtos/patient.backend.dto.js';
import { IPaginatedResult, IPatientFilterQuery } from '../interfaces/patient.backend.interface.js';

export class PatientService {
  private repository: PatientRepository;

  constructor(repository = new PatientRepository()) {
    this.repository = repository;
  }

  /**
   * Retrieves all patients, optionally filtered by search text, doctor, and paginated.
   */
  async getAllPatients(filter?: IPatientFilterQuery): Promise<IPaginatedResult<PatientResponseDto>> {
    const result = await this.repository.findAll(filter);
    return {
      ...result,
      items: toPatientListResponseDto(result.items),
    };
  }

  /**
   * Retrieves a single patient by ID (scoped to doctor if provided).
   */
  async getPatientById(id: string, doctorId?: string): Promise<PatientResponseDto | null> {
    const entity = await this.repository.findById(id, doctorId);
    if (!entity) return null;
    return toPatientResponseDto(entity);
  }

  /**
   * Creates a new patient with sanitized validation, doctor association, and DTO mapping.
   */
  async registerPatient(rawInput: any, doctorId?: string): Promise<PatientResponseDto> {
    const dto: CreatePatientRequestDto = buildCreatePatientDto(rawInput, doctorId);

    if (!dto.name) {
      throw new Error('Validation Error: Patient name is required.');
    }
    if (!dto.phone || dto.phone.length !== 10) {
      throw new Error('Validation Error: Valid 10-digit mobile number is required.');
    }

    const created = await this.repository.create(dto);
    return toPatientResponseDto(created);
  }

  /**
   * Updates patient details (scoped to doctor if provided).
   */
  async updatePatient(id: string, rawInput: any, doctorId?: string): Promise<PatientResponseDto | null> {
    const dto: UpdatePatientRequestDto = buildUpdatePatientDto(rawInput);
    if (doctorId && !dto.doctorId) {
      dto.doctorId = doctorId;
    }
    const updated = await this.repository.update(id, dto, doctorId);
    if (!updated) return null;
    return toPatientResponseDto(updated);
  }

  /**
   * Deletes a patient (scoped to doctor if provided).
   */
  async deletePatient(id: string, doctorId?: string): Promise<boolean> {
    return this.repository.delete(id, doctorId);
  }

  /**
   * Adds or updates session history for a Pushya date (scoped to doctor if provided).
   */
  async recordSessionHistory(
    id: string,
    history: AddSessionHistoryRequestDto,
    doctorId?: string
  ): Promise<PatientResponseDto | null> {
    if (!history.pushyaDate) {
      throw new Error('Validation Error: pushyaDate is required.');
    }
    const updated = await this.repository.saveHistory(id, history, doctorId);
    if (!updated) return null;
    return toPatientResponseDto(updated);
  }
}

