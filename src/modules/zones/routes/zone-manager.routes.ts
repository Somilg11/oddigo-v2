import { Router } from 'express';
import { ZoneManagerController } from '../controllers/zone-manager.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.ZONE_MANAGER));

router.get('/zones', ZoneManagerController.getZones);
router.get('/overview', ZoneManagerController.getOverview);
router.get('/field-executives', ZoneManagerController.getFieldExecutives);
router.get('/zones/:id/stats', ZoneManagerController.getZoneStats);
router.get('/zones/:id/supply-demand', ZoneManagerController.getSupplyDemand);
router.post('/zones/:id/recruit', ZoneManagerController.triggerRecruitment);
router.post('/tasks', ZoneManagerController.assignTask);
router.get('/tasks/:taskId', ZoneManagerController.getTaskDetails);

export default router;
