import { Router } from 'express';
import { RatingController } from '../controllers/rating.controller';
import { protect } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/jobs/:id/rate', RatingController.rateJob);
router.get('/workers/:id/ratings', RatingController.getWorkerRatings);

export default router;
