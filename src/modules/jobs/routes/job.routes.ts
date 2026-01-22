import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { protect } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/history', JobController.getHistory);
router.post('/estimate', JobController.getEstimate); // Public or Protected? Let's make it protected for simplicity or public? Public is better for marketing.
router.post('/', JobController.createJob);
router.post('/:id/cancel', JobController.cancelJob);
router.get('/:id', JobController.getJob);
router.post('/:id/find-workers', JobController.findWorkers);

// Execution Logic
router.post('/:id/accept', JobController.acceptJob); // Worker accepts offer
router.patch('/:id/start', JobController.startJob);
router.post('/:id/amendment', JobController.requestAmendment); // Worker requests
router.patch('/:id/amendment', JobController.respondToAmendment); // User approves/rejects
router.post('/:id/complete', JobController.completeJob);

export default router;
