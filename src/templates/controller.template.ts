import { FieldDefinition } from "../types";

const generateControllerContent = (
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string => {
  // Check if there are any file/image fields
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.type.toLowerCase() === "image"
  );

  return `import { Request, Response, NextFunction } from 'express';
import { ${camelCaseName}Services } from './${folderName}.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { paginationFields } from '../../../constants/pagination';

// Filter options for queries
const ${folderName}FilterableFields = [${fields
  .filter(f => f.type.toLowerCase() === "string" || f.type.toLowerCase() === "enum")
  .map(f => `'${f.name}'`)
  .join(", ")}];

const create${camelCaseName} = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    ${
      hasImageField
        ? `const { image, ...${folderName}Data } = req.body;
    if (image?.length > 0) {
      ${folderName}Data.image = image[0];
    }`
        : `const ${folderName}Data = req.body;`
    }
    
    const result = await ${camelCaseName}Services.create${camelCaseName}(${folderName}Data);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: '${camelCaseName} created successfully',
      data: result,
    });
  },
);

const update${camelCaseName} = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    ${
      hasImageField
        ? `const { image, ...${folderName}Data } = req.body;
    if (image?.length > 0) {
      ${folderName}Data.image = image[0];
    }`
        : `const ${folderName}Data = req.body;`
    }
    
    const result = await ${camelCaseName}Services.update${camelCaseName}(id, ${folderName}Data);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName} updated successfully',
      data: result,
    });
  },
);

const delete${camelCaseName} = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await ${camelCaseName}Services.delete${camelCaseName}(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName} deleted successfully',
      data: result,
    });
  },
);

const get${camelCaseName} = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await ${camelCaseName}Services.get${camelCaseName}(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName} retrieved successfully',
      data: result,
    });
  },
);

const getAll${camelCaseName}s = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract pagination and filtering options
    const paginationOptions = pick(req.query, paginationFields);
    const filters = pick(req.query, ${folderName}FilterableFields);
    
    // Add search functionality
    const searchOptions = {
      ...paginationOptions,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
    };
    
    const result = await ${camelCaseName}Services.getAll${camelCaseName}s(searchOptions);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName}s retrieved successfully',
      meta: result.pagination,
      data: result.data,
    });
  },
);

// Additional controller methods
const count${camelCaseName}s = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query, ${folderName}FilterableFields);
    const result = await ${camelCaseName}Services.count${camelCaseName}s(filters);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName} count retrieved successfully',
      data: { count: result },
    });
  },
);

const check${camelCaseName}Exists = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await ${camelCaseName}Services.exists${camelCaseName}({ _id: id });
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName} existence checked',
      data: { exists: result },
    });
  },
);

export const ${camelCaseName}Controller = {
  create${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
  get${camelCaseName},
  getAll${camelCaseName}s,
  count${camelCaseName}s,
  check${camelCaseName}Exists,
};`;
};
