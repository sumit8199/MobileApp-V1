import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Automatically load .env.dev if present, otherwise .env
const envFile = process.env.ENV_FILE || (fs.existsSync(path.resolve(process.cwd(), '.env.dev')) ? '.env.dev' : '.env');
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const appConfig = {
  port: parseInt(process.env.PORT || '5002', 10),
  jwtSecret: process.env.JWT_SECRET || 'suvarna_ayurveda_jwt_secret_key_2026',
};

export const dbConfig = {
  host: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'suvarnacaredb',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10', 10),
  queueLimit: 0,
};
