import express from 'express';
import * as orderController from './order.controller';
import { protect } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createOrderSchema, updateStatusSchema } from './order.validation';

const router = express.Router();

router.use(protect);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id/status', validate(updateStatusSchema), orderController.updateStatus);

export default router;
