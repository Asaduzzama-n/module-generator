import express from 'express';
import { TestuserRoutes } from '../app/modules/testuser/testuser.route'
import { OrderRoutes } from '../app/modules/order/order.route'

const router = express.Router();

const apiRoutes = [
  // Routes will be added here
  { path: '/testuser', route: TestuserRoutes },
  { path: '/order', route: OrderRoutes }];

apiRoutes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
