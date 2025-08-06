import { FieldDefinition } from "../types";

export const generateServiceContent = (
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string => {
  // Check if there are any file/image fields
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.name === "images" || field.name === "media" || field.type.toLowerCase() === "image"
  );

  // Check for reference fields for population
  const referenceFields = fields.filter(
    (field) => field.type.toLowerCase() === "objectid" || 
    (field.type.toLowerCase() === "array" && field.arrayItemType?.toLowerCase() === "objectid")
  );

  const populateString = referenceFields.length > 0 
    ? `.populate('${referenceFields.map(f => f.name).join("').populate('")}')`
    : "";

  // Generate filterable fields (string and enum types)
  const filterableFields = fields.filter(
    f => f.type.toLowerCase() === "string" || f.type.toLowerCase() === "enum"
  );

  // Generate searchable fields (string types only)
  const searchableFields = fields.filter(
    f => f.type.toLowerCase() === "string"
  );

  return `import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { I${camelCaseName}Filterables, I${camelCaseName} } from './${folderName}.interface';
import { ${camelCaseName} } from './${folderName}.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { ${folderName}SearchableFields } from './${folderName}.constants';
import { Types } from 'mongoose';
${
  hasImageField
    ? `import { removeUploadedFiles } from '../../../utils/deleteUploadedFile';`
    : ""
}

const create${camelCaseName} = async (
  user: JwtPayload,
  payload: I${camelCaseName}
): Promise<I${camelCaseName}> => {
  try {
    const result = await ${camelCaseName}.create(payload);
    if (!result) {
      ${hasImageField ? `removeUploadedFiles(payload.images || payload.media);` : ""}
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create ${camelCaseName}, please try again with valid data.'
      );
    }

    return result;
  } catch (error: any) {
    ${hasImageField ? `if (payload.images || payload.media) removeUploadedFiles(payload.images || payload.media);` : ""}
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const getAll${camelCaseName}s = async (
  user: JwtPayload,
  filterables: I${camelCaseName}Filterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: ${folderName}SearchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {};

  const [result, total] = await Promise.all([
    ${camelCaseName}
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })${populateString},
    ${camelCaseName}.countDocuments(whereConditions),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getSingle${camelCaseName} = async (id: string): Promise<I${camelCaseName}> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ${camelCaseName} ID');
  }

  const result = await ${camelCaseName}.findById(id)${populateString};
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested ${folderName} not found, please try again with valid id'
    );
  }

  return result;
};

const update${camelCaseName} = async (
  id: string,
  payload: Partial<I${camelCaseName}>
): Promise<I${camelCaseName} | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ${camelCaseName} ID');
  }

  const result = await ${camelCaseName}.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    }
  )${populateString};

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested ${folderName} not found, please try again with valid id'
    );
  }

  return result;
};

const delete${camelCaseName} = async (id: string): Promise<I${camelCaseName}> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ${camelCaseName} ID');
  }

  const result = await ${camelCaseName}.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting ${folderName}, please try again with valid id.'
    );
  }

  return result;
};

export const ${camelCaseName}Services = {
  create${camelCaseName},
  getAll${camelCaseName}s,
  getSingle${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
};`;
};
