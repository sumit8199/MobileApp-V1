export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  databaseConnected: boolean;
}

export interface ServiceHealthStatus {
  service: string;
  status: 'UP' | 'DOWN' | 'CONNECTING';
  database: string;
  databaseConnected: boolean;
  timestamp: string;
}

export interface DatabaseConnectionStatus {
  patientService: boolean;
  reminderService: boolean;
  sqlServerConnected: boolean;
  lastChecked: Date;
}
