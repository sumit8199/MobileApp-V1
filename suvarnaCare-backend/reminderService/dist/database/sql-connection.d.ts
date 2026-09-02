import { Pool } from 'mysql2/promise';
export declare function connectSqlServer(): Promise<Pool | null>;
export declare function initializeDatabaseSchema(activePool: Pool): Promise<void>;
export declare function getSqlPool(): Pool | null;
export declare function isSqlConnected(): boolean;
export declare function closeSqlServer(): Promise<void>;
