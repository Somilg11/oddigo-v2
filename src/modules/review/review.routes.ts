import express from 'express';
import * as reviewController from './review.controller';
import { protect } from '../../middlewares/auth';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/', reviewController.createReview);
router.get('/:workerId', reviewController.getReviews);

export default router;
