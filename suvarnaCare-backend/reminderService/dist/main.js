#!/usr/bin/env node
import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { appConfig } from './config/db.config.js';
import { connectSqlServer, closeSqlServer } from './database/sql-connection.js';
import { ReminderService } from './services/reminder.service.js';
import { SchedulerService } from './services/scheduler.service.js';
const PORT = appConfig.port || 5002;
const server = http.createServer(app);
const reminderService = new ReminderService();
const schedulerService = new SchedulerService(reminderService);
export default function main(port = PORT) {
    server.listen(port, () => {
        console.log(`🚀 [ReminderService] Running on http://localhost:${port}`);
        console.log(`📊 [ReminderService] Health check available at http://localhost:${port}/health`);
        console.log(`⏰ [ReminderService] Reminders API available at http://localhost:${port}/api/reminders`);
        console.log(`💬 [ReminderService] WhatsApp Message Service ready (3-Day Advance & Day-of Alerts)`);
        connectSqlServer().catch((err) => {
            console.warn(`⚠️ [ReminderService] Initial database connection attempt finished: ${err?.message}`);
        });
        schedulerService.start();
    });
    return server;
}
process.on('SIGINT', async () => {
    console.log('🛑 [ReminderService] Shutting down gracefully (SIGINT)...');
    schedulerService.stop();
    await closeSqlServer();
    server.close(() => process.exit(0));
});
process.on('SIGTERM', async () => {
    console.log('🛑 [ReminderService] Shutting down gracefully (SIGTERM)...');
    schedulerService.stop();
    await closeSqlServer();
    server.close(() => process.exit(0));
});
process.on('unhandledRejection', (err) => {
    console.error(`💥 [ReminderService] Unhandled Rejection:`, err?.message || err);
});
main();
//# sourceMappingURL=main.js.map