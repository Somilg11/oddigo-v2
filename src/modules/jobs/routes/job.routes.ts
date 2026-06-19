import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { protect } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/history', JobController.getHistory);
router.post('/estimate', JobController.getEstimate);
router.post('/', JobController.createJob);
router.post('/:id/cancel', JobController.cancelJob);
router.get('/:id', JobController.getJob);
router.post('/:id/find-workers', JobController.findWorkers);

// Worker Actions
router.post('/:id/accept', JobController.acceptJob);
router.patch('/:id/start', JobController.startJob);
router.post('/:id/request-otp', JobController.requestJobOtp);
router.post('/:id/verify-otp', JobController.verifyJobOtp);
router.post('/:id/estimate', JobController.submitEstimate);
router.post('/:id/before-photo', JobController.addBeforePhoto);
router.post('/:id/after-photo', JobController.addAfterPhoto);
router.post('/:id/complete', JobController.completeJob);

// Amendment (Scope Creep)
router.post('/:id/amendment', JobController.requestAmendment);
router.patch('/:id/amendment', JobController.respondToAmendment);

// Customer Actions
router.patch('/:id/final-approval', JobController.approveFinalPrice);
router.post('/:id/signature', JobController.submitDigitalSignature);
router.post('/:id/pay', JobController.processPayment);
router.post('/:id/pay/confirm', JobController.confirmPayment);
router.post('/:id/refund', JobController.refundJob);

export default router;
