import 'dotenv/config';

export const appConfig = {
  port: parseInt(process.env.PORT || '5001', 10),
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
