import express from 'express';
import * as workerController from './worker.controller';
import { protect, authorize } from '../../middlewares/auth';
import upload from '../../config/multer';
import { validate } from '../../middlewares/validate';
import { updateWorkerProfileSchema } from './worker.validation';

const router = express.Router();

router.use(protect);
router.use(authorize('worker'));

router.get('/profile', workerController.getProfile);
router.patch('/profile', validate(updateWorkerProfileSchema), workerController.updateProfile);
router.post('/upload-documents', upload.array('documents', 5), workerController.uploadDocs);
router.patch('/toggle-availability', workerController.toggleAvailability);

export default router;
