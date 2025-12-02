import express from 'express';
import * as contentController from './content.controller';
import { protect, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createBannerSchema, createOfferSchema, setConfigSchema } from './content.validation';

const router = express.Router();

// Public routes (or User/Worker accessible)
router.get('/banners', contentController.getBanners);
router.get('/offers', contentController.getOffers);
router.get('/config/:key', contentController.getAppConfig);

// Admin only routes
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.post('/banners', validate(createBannerSchema), contentController.createBanner);
router.delete('/banners/:id', contentController.deleteBanner);

router.post('/offers', validate(createOfferSchema), contentController.createOffer);

router.post('/config', validate(setConfigSchema), contentController.setAppConfig);
router.get('/config', contentController.getAllConfigs);

export default router;
