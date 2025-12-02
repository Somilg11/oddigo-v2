import express from 'express';
import * as userController from './user.controller';
import { protect, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { updateProfileSchema, searchWorkersSchema } from './user.validation';

const router = express.Router();

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.get('/search-workers', validate(searchWorkersSchema), userController.searchWorkers);

export default router;
