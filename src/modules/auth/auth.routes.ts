import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate';
import { registerUserSchema, loginSchema, registerWorkerSchema } from './auth.validation';

const router = express.Router();

router.post('/register/user', validate(registerUserSchema), authController.registerUser);
router.post('/login/user', validate(loginSchema), authController.loginUser);

router.post('/register/worker', validate(registerWorkerSchema), authController.registerWorker);
router.post('/login/worker', validate(loginSchema), authController.loginWorker);

router.post('/login/admin', validate(loginSchema), authController.loginAdmin);

export default router;
