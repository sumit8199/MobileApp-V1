import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';

const router = Router();
const controller = new PatientController();

// Database & Service Health Check
router.get('/health/db', controller.healthCheck);

// Patient CRUD Endpoints
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Pushya Session History Endpoint
router.post('/:id/history', controller.addHistory);

export default router;
