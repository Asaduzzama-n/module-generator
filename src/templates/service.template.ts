const generateServiceContent = (
  camelCaseName: string,
  folderName: string,
  fields: { name: string; type: string }[]
): string => {
  // Check if there are any file/image fields
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.type.toLowerCase() === "image"
  );

  return `import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface';
import { ${camelCaseName} } from './${folderName}.model';
import { Types } from 'mongoose';
${
  hasImageField
    ? `import fs from 'fs';
import { removeUploadedFiles } from '../../../utils/deleteUploadedFile';`
    : ""
}

const create${camelCaseName} = async (payload: I${camelCaseName}): Promise<I${camelCaseName}> => {
  const result = ${camelCaseName}.create(payload);
  if (!result) {
    ${hasImageField ? `removeUploadedFiles(payload.image);` : ""}
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create ${folderName}');
  }

  return result;
};

const update${camelCaseName} = async (
  id: string,
  payload: Partial<I${camelCaseName}>,
): Promise<I${camelCaseName} | null> => {
  const isExist = await ${camelCaseName}.findById(new Types.ObjectId(id));
  if (!isExist) throw new ApiError(StatusCodes.NOT_FOUND, '${camelCaseName} not found');
  ${hasImageField ? `//   fs.unlinkSync(isExist.image);` : ""}
  const result = await ${camelCaseName}.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  return result;
};

const delete${camelCaseName} = async (id: string): Promise<I${camelCaseName} | null> => {
  const result = await ${camelCaseName}.findByIdAndDelete(new Types.ObjectId(id));
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete ${folderName}s.');
  return result;
};

const get${camelCaseName} = async (id: string): Promise<I${camelCaseName} | null> => {
  const result = await ${camelCaseName}.findById(new Types.ObjectId(id));
  if (!result)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Requested ${folderName} not found.');
  return result;
};

const getAll${camelCaseName}s = async (): Promise<I${camelCaseName}[]> => {
  const result = await ${camelCaseName}.find();

  return result;
};

export const ${camelCaseName}Services = {
  create${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
  get${camelCaseName},
  getAll${camelCaseName}s,
};`;
};
