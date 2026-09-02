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
import { IPatientFilterQuery } from '../interfaces/patient.backend.interface.js';

export class PatientService {
  private repository: PatientRepository;

  constructor(repository = new PatientRepository()) {
    this.repository = repository;
  }

  /**
   * Retrieves all patients, optionally filtered by search text.
   */
  async getAllPatients(filter?: IPatientFilterQuery): Promise<PatientResponseDto[]> {
    const entities = await this.repository.findAll(filter);
    return toPatientListResponseDto(entities);
  }

  /**
   * Retrieves a single patient by ID.
   */
  async getPatientById(id: string): Promise<PatientResponseDto | null> {
    const entity = await this.repository.findById(id);
    if (!entity) return null;
    return toPatientResponseDto(entity);
  }

  /**
   * Creates a new patient with sanitized validation and DTO mapping.
   */
  async registerPatient(rawInput: any): Promise<PatientResponseDto> {
    const dto: CreatePatientRequestDto = buildCreatePatientDto(rawInput);

    if (!dto.name) {
      throw new Error('Validation Error: Patient name is required.');
    }
    if (!dto.birthDate) {
      throw new Error('Validation Error: Patient birthDate is required (e.g., 2025-02-01).');
    }
    if (!dto.parentName) {
      throw new Error('Validation Error: Parent / Guardian name is required.');
    }
    if (!dto.phone || dto.phone.length < 10) {
      throw new Error('Validation Error: Valid 10-digit mobile number is required.');
    }

    const created = await this.repository.create(dto);
    return toPatientResponseDto(created);
  }

  /**
   * Updates patient details.
   */
  async updatePatient(id: string, rawInput: any): Promise<PatientResponseDto | null> {
    const dto: UpdatePatientRequestDto = buildUpdatePatientDto(rawInput);
    const updated = await this.repository.update(id, dto);
    if (!updated) return null;
    return toPatientResponseDto(updated);
  }

  /**
   * Deletes a patient.
   */
  async deletePatient(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  /**
   * Adds or updates session history for a Pushya date.
   */
  async recordSessionHistory(
    id: string,
    history: AddSessionHistoryRequestDto
  ): Promise<PatientResponseDto | null> {
    if (!history.pushyaDate) {
      throw new Error('Validation Error: pushyaDate is required.');
    }
    const updated = await this.repository.saveHistory(id, history);
    if (!updated) return null;
    return toPatientResponseDto(updated);
  }
}
