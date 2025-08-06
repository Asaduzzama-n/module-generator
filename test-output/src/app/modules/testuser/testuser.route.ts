import express from 'express';
import { TestuserController } from './testuser.controller';
import validateRequest from '../../../middlewares/validateRequest';
import { TestuserValidations } from './testuser.validation';


const router = express.Router();

router.post(
  '/',
  
  validateRequest(TestuserValidations.create),
  TestuserController.createTestuser,
);

router.get('/', TestuserController.getAllTestusers);

router.get('/:id', TestuserController.getTestuser);

router.patch(
  '/:id',
  
  validateRequest(TestuserValidations.update),
  TestuserController.updateTestuser,
);

router.delete('/:id', TestuserController.deleteTestuser);

export const TestuserRoutes = router;