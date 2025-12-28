import express from 'express';
import { SkiptestController } from './skiptest.controller';
import { SkiptestValidations } from './skiptest.validation';
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
  SkiptestController.getAllSkiptests
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  SkiptestController.getSingleSkiptest
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(SkiptestValidations.createSkiptestZodSchema),
  SkiptestController.createSkiptest
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(SkiptestValidations.updateSkiptestZodSchema),
  SkiptestController.updateSkiptest
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  SkiptestController.deleteSkiptest
);

export const SkiptestRoutes = router;