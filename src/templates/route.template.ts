import { FieldDefinition } from "../types";

const generateRouteContent = (
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string => {
  // Check if there are any file/image fields
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.name === "images" || field.name === "media" || field.type.toLowerCase() === "image"
  );

  return `import express from 'express';
import { ${camelCaseName}Controller } from './${folderName}.controller';
import { ${camelCaseName}Validations } from './${folderName}.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
${hasImageField ? `import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody';` : ""}

const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ${camelCaseName}Controller.getAll${camelCaseName}s
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ${camelCaseName}Controller.getSingle${camelCaseName}
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ${hasImageField ? `fileAndBodyProcessorUsingDiskStorage(),` : ""}
  validateRequest(${camelCaseName}Validations.create${camelCaseName}ZodSchema),
  ${camelCaseName}Controller.create${camelCaseName}
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ${hasImageField ? `fileAndBodyProcessorUsingDiskStorage(),` : ""}
  validateRequest(${camelCaseName}Validations.update${camelCaseName}ZodSchema),
  ${camelCaseName}Controller.update${camelCaseName}
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ${camelCaseName}Controller.delete${camelCaseName}
);

export const ${camelCaseName}Routes = router;`;
};

export { generateRouteContent };