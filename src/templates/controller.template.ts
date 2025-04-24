const generateControllerContent = (
  camelCaseName: string,
  folderName: string,
  fields: { name: string; type: string }[]
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
    console.log(req.body);
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
    const result = await ${camelCaseName}Services.getAll${camelCaseName}s();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: '${camelCaseName}s retrieved successfully',
      data: result,
    });
  },
);

export const ${camelCaseName}Controller = {
  create${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
  get${camelCaseName},
  getAll${camelCaseName}s,
};`;
};
