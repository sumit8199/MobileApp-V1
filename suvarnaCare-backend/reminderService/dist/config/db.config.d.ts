import 'dotenv/config';
export declare const appConfig: {
    port: number;
};
export declare const dbConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
};
