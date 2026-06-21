import { Router } from 'express';
import { CityManagerController } from '../controllers/city-manager.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.CITY_MANAGER));

router.get('/dashboard', CityManagerController.getDashboard);
router.get('/overview', CityManagerController.getOverview);
router.get('/zones', CityManagerController.getZones);
router.post('/zones', CityManagerController.createZone);
router.get('/campaigns', CityManagerController.getCampaigns);
router.post('/campaigns', CityManagerController.createCampaign);
router.post('/categories', CityManagerController.addCategory);

export default router;
