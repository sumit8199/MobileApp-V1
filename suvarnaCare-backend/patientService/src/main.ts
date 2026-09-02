#!/usr/bin/env node
import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { appConfig } from './config/db.config.js';
import { connectSqlServer, closeSqlServer } from './database/sql-connection.js';

const PORT = appConfig.port || 5001;
const server = http.createServer(app);

export default function main(port: number = PORT) {
  server.listen(port, () => {
    console.log(`🚀 [PatientService] Running on http://localhost:${port}`);
    console.log(`📊 [PatientService] Health check available at http://localhost:${port}/health`);
    console.log(`📋 [PatientService] Patients API available at http://localhost:${port}/api/patients`);

    // Connect to SQL Server database asynchronously
    connectSqlServer().catch((err) => {
      console.warn(`⚠️ [PatientService] Initial SQL Server connection attempt finished: ${err?.message}`);
    });
  });

  return server;
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🛑 [PatientService] Shutting down gracefully (SIGINT)...');
  await closeSqlServer();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  console.log('🛑 [PatientService] Shutting down gracefully (SIGTERM)...');
  await closeSqlServer();
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err: any) => {
  console.error(`💥 [PatientService] Unhandled Rejection:`, err?.message || err);
});

// Run server
main();
