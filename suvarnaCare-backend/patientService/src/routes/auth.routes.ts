import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();
const controller = new AuthController();

// Public Authentication Endpoints
router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/token', controller.generateToken);
router.post('/token', controller.generateToken);

// Token Verification Endpoint
router.get('/verify', controller.verify);

export default router;
