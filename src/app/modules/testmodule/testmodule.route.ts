import express from 'express';
import { TestmoduleController } from './testmodule.controller';
import { TestmoduleValidations } from './testmodule.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';


const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TestmoduleController.getAllTestmodules
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TestmoduleController.getSingleTestmodule
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(TestmoduleValidations.createTestmoduleZodSchema),
  TestmoduleController.createTestmodule
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(TestmoduleValidations.updateTestmoduleZodSchema),
  TestmoduleController.updateTestmodule
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TestmoduleController.deleteTestmodule
);

export const TestmoduleRoutes = router;