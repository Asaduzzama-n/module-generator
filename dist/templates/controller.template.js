"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateControllerContent = void 0;
const generateControllerContent = (camelCaseName, folderName, fields) => {
    // Check if there are any file/image fields
    const hasImageField = fields.some((field) => field.name === "image" || field.name === "images" || field.name === "media" || field.type.toLowerCase() === "image");
    // Generate filterable fields (string and enum types)
    const filterableFields = fields.filter(f => f.type.toLowerCase() === "string" || f.type.toLowerCase() === "enum");
    return `import { Request, Response } from 'express';
import { ${camelCaseName}Services } from './${folderName}.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { ${folderName}Filterables } from './${folderName}.constants';
import { paginationFields } from '../../../interfaces/pagination';

const create${camelCaseName} = catchAsync(async (req: Request, res: Response) => {
  ${hasImageField
        ? `const { images, media, ...${folderName}Data } = req.body;
  
  if (images && images.length > 0) {
    ${folderName}Data.images = images;
  }
  
  if (media && media.length > 0) {
    ${folderName}Data.media = media;
  }`
        : `const ${folderName}Data = req.body;`}

  const result = await ${camelCaseName}Services.create${camelCaseName}(
    req.user!,
    ${folderName}Data
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: '${camelCaseName} created successfully',
    data: result,
  });
});

const update${camelCaseName} = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ${folderName}Data = req.body;

  const result = await ${camelCaseName}Services.update${camelCaseName}(id, ${folderName}Data);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: '${camelCaseName} updated successfully',
    data: result,
  });
});

const getSingle${camelCaseName} = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ${camelCaseName}Services.getSingle${camelCaseName}(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: '${camelCaseName} retrieved successfully',
    data: result,
  });
});

const getAll${camelCaseName}s = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, ${folderName}Filterables);
  const pagination = pick(req.query, paginationFields);

  const result = await ${camelCaseName}Services.getAll${camelCaseName}s(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: '${camelCaseName}s retrieved successfully',
    data: result,
  });
});

const delete${camelCaseName} = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ${camelCaseName}Services.delete${camelCaseName}(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: '${camelCaseName} deleted successfully',
    data: result,
  });
});

export const ${camelCaseName}Controller = {
  create${camelCaseName},
  update${camelCaseName},
  getSingle${camelCaseName},
  getAll${camelCaseName}s,
  delete${camelCaseName},
};`;
};
exports.generateControllerContent = generateControllerContent;
