import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service.js';
import { buildApiResponse, buildPaginatedApiResponse } from '../dtos/patient.backend.dto.js';
import { isSqlConnected } from '../database/sql-connection.js';

export class PatientController {
  private service: PatientService;

  constructor(service = new PatientService()) {
    this.service = service;
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const start = req.query.start !== undefined ? parseInt(req.query.start as string, 10) : undefined;
      const pageSize = req.query.pageSize !== undefined ? parseInt(req.query.pageSize as string, 10) : undefined;
      const page = req.query.page !== undefined ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset !== undefined ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await this.service.getAllPatients({ search, start, pageSize, page, limit, offset });
      
      res.status(200).json(
        buildPaginatedApiResponse(
          result.items,
          {
            total: result.total,
            start: result.start,
            pageSize: result.pageSize,
            page: result.page,
            totalPages: result.totalPages,
          },
          `Retrieved ${result.items.length} patients successfully.`,
          isSqlConnected()
        )
      );
    } catch (error: any) {
      res.status(500).json(buildApiResponse([], error.message, isSqlConnected()));
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const patient = await this.service.getPatientById(id);
      if (!patient) {
        res.status(404).json(buildApiResponse(null, `Patient with ID ${id} not found.`, isSqlConnected()));
        return;
      }
      res.status(200).json(buildApiResponse(patient, 'Patient found.', isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse(null, error.message, isSqlConnected()));
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await this.service.registerPatient(req.body);
      res.status(201).json(buildApiResponse(created, 'Patient registered successfully in MySQL database.', isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, isSqlConnected()));
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const updated = await this.service.updatePatient(id, req.body);
      if (!updated) {
        res.status(404).json(buildApiResponse(null, `Patient with ID ${id} not found.`, isSqlConnected()));
        return;
      }
      res.status(200).json(buildApiResponse(updated, 'Patient updated successfully.', isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, isSqlConnected()));
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const success = await this.service.deletePatient(id);
      if (!success) {
        res.status(404).json(buildApiResponse(null, `Patient with ID ${id} not found.`, isSqlConnected()));
        return;
      }
      res.status(200).json(buildApiResponse({ id }, 'Patient deleted successfully.', isSqlConnected()));
    } catch (error: any) {
      res.status(500).json(buildApiResponse(null, error.message, isSqlConnected()));
    }
  };

  addHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const updated = await this.service.recordSessionHistory(id, req.body);
      if (!updated) {
        res.status(404).json(buildApiResponse(null, `Patient with ID ${id} not found.`, isSqlConnected()));
        return;
      }
      res.status(200).json(buildApiResponse(updated, 'Patient session history saved.', isSqlConnected()));
    } catch (error: any) {
      res.status(400).json(buildApiResponse(null, error.message, isSqlConnected()));
    }
  };

  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    const connected = isSqlConnected();
    res.status(200).json({
      service: 'PatientService',
      status: 'UP',
      database: 'MySQL Server',
      databaseConnected: connected,
      timestamp: new Date().toISOString(),
    });
  };
}
