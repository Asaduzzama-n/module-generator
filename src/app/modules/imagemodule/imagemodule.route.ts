import express from 'express';
import { ImagemoduleController } from './imagemodule.controller';
import { ImagemoduleValidations } from './imagemodule.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody';

const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ImagemoduleController.getAllImagemodules
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ImagemoduleController.getSingleImagemodule
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(ImagemoduleValidations.createImagemoduleZodSchema),
  ImagemoduleController.createImagemodule
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(ImagemoduleValidations.updateImagemoduleZodSchema),
  ImagemoduleController.updateImagemodule
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ImagemoduleController.deleteImagemodule
);

export const ImagemoduleRoutes = router;