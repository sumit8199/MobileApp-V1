import express from 'express';
import cors from 'cors';
import reminderRoutes from './routes/reminder.routes.js';
import { isSqlConnected } from './database/sql-connection.js';
const app = express();
app.use(cors({
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
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (_req, res) => {
    res.status(200).json({
        service: 'ReminderService',
        status: 'UP',
        databaseConnected: isSqlConnected(),
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/reminders', reminderRoutes);
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        timestamp: new Date().toISOString(),
    });
});
app.use((err, _req, res, _next) => {
    console.error('💥 [ReminderService Error]:', err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
    });
});
export default app;
//# sourceMappingURL=app.js.map