// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import patientRoutes from './routes/patient.routes.js';
import { isSqlConnected } from './database/sql-connection.js';

const app: Application = express();

// Comprehensive CORS setup allowing any local development port
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'User-Agent',
      'Referer',
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    service: 'PatientService',
    status: 'UP',
    databaseConnected: isSqlConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Modular endpoint groups
app.use('/api/patients', patientRoutes);

// 404 Handler
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: any): void => {
  console.error('💥 [PatientService Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

export default app;
