import express from 'express';
import { OrderController } from './order.controller';
import validateRequest from '../../../middlewares/validateRequest';
import { OrderValidations } from './order.validation';


const router = express.Router();

router.post(
  '/',
  
  validateRequest(OrderValidations.create),
  OrderController.createOrder,
);

router.get('/', OrderController.getAllOrders);

router.get('/:id', OrderController.getOrder);

router.patch(
  '/:id',
  
  validateRequest(OrderValidations.update),
  OrderController.updateOrder,
);

router.delete('/:id', OrderController.deleteOrder);

export const OrderRoutes = router;