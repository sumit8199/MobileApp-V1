// src/app.ts
import express, { Application, Request, Response, json } from 'express'; // Modern named destructured imports
import cors from 'cors';

// Instantiate the Express application framework instance
const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(json()); // Using the named middleware import directly instead of express.json()

// Health Check Route
app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Future modular endpoint groups will mount here:
// import userRouter from './routes/userRoutes';
// app.use('/api/v1/users', userRouter);

export default app;
