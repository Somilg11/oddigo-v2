import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';

const router = Router();

router.get('/categories', ServiceController.getCategories);
router.get('/sub-services', ServiceController.getSubServices);
router.get('/sub-services/:id', ServiceController.getSubServiceById);

export default router;
