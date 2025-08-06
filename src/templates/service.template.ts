import { FieldDefinition } from "../types";

const generateServiceContent = (
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string => {
  // Check if there are any file/image fields
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.type.toLowerCase() === "image"
  );

  // Check for reference fields for population
  const referenceFields = fields.filter(
    (field) => field.type.toLowerCase() === "objectid" || 
    (field.type.toLowerCase() === "array" && field.arrayItemType?.toLowerCase() === "objectid")
  );

  const populateString = referenceFields.length > 0 
    ? `.populate('${referenceFields.map(f => f.name).join("').populate('")}')`
    : "";

  return `import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface';
import { ${camelCaseName} } from './${folderName}.model';
import { Types } from 'mongoose';
import { SortOrder } from 'mongoose';
${
  hasImageField
    ? `import fs from 'fs';
import { removeUploadedFiles } from '../../../utils/deleteUploadedFile';`
    : ""
}

// Query options interface
interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

const create${camelCaseName} = async (payload: Partial<I${camelCaseName}>): Promise<I${camelCaseName}> => {
  try {
    const result = await ${camelCaseName}.create(payload);
    if (!result) {
      ${hasImageField ? `removeUploadedFiles(payload.image);` : ""}
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create ${folderName}');
    }

    // Populate references if any
    ${referenceFields.length > 0 ? `await result${populateString};` : ""}
    
    return result;
  } catch (error: any) {
    ${hasImageField ? `if (payload.image) removeUploadedFiles(payload.image);` : ""}
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const update${camelCaseName} = async (
  id: string,
  payload: Partial<I${camelCaseName}>,
): Promise<I${camelCaseName} | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ${folderName} ID');
  }

  const isExist = await ${camelCaseName}.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, '${camelCaseName} not found');
  }

  try {
    ${hasImageField ? `// Handle file cleanup if image is being updated
    if (payload.image && isExist.image) {
      try {
        fs.unlinkSync(isExist.image);
      } catch (error) {
        console.warn('Could not delete old image file:', error);
      }
    }` : ""}

    const result = await ${camelCaseName}.findByIdAndUpdate(
      id, 
      payload, 
      { 
        new: true, 
        runValidators: true 
      }
    )${populateString};
    
    return result;
  } catch (error: any) {
    ${hasImageField ? `if (payload.image) removeUploadedFiles(payload.image);` : ""}
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const delete${camelCaseName} = async (id: string): Promise<I${camelCaseName} | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ${folderName} ID');
  }

  const isExist = await ${camelCaseName}.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, '${camelCaseName} not found');
  }

  ${hasImageField ? `// Clean up associated files
  if (isExist.image) {
    try {
      fs.unlinkSync(isExist.image);
    } catch (error) {
      console.warn('Could not delete image file:', error);
    }
  }` : ""}

  const result = await ${camelCaseName}.findByIdAndDelete(id);
  return result;
};

const get${camelCaseName} = async (id: string): Promise<I${camelCaseName} | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ${folderName} ID');
  }

  const result = await ${camelCaseName}.findById(id)${populateString};
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, '${camelCaseName} not found');
  }
  
  return result;
};

const getAll${camelCaseName}s = async (options: QueryOptions = {}): Promise<{
  data: I${camelCaseName}[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = options;

  // Build search query
  const searchQuery: any = {};
  if (search) {
    const searchFields = [${fields
      .filter(f => f.type.toLowerCase() === "string")
      .map(f => `'${f.name}'`)
      .join(", ")}];
    
    if (searchFields.length > 0) {
      searchQuery.$or = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build sort object
  const sortObj: { [key: string]: SortOrder } = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute queries
  const [data, total] = await Promise.all([
    ${camelCaseName}
      .find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)${populateString}
      .lean(),
    ${camelCaseName}.countDocuments(searchQuery)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};

// Additional utility methods
const count${camelCaseName}s = async (filter: any = {}): Promise<number> => {
  return await ${camelCaseName}.countDocuments(filter);
};

const exists${camelCaseName} = async (filter: any): Promise<boolean> => {
  const result = await ${camelCaseName}.findOne(filter).select('_id').lean();
  return !!result;
};

export const ${camelCaseName}Services = {
  create${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
  get${camelCaseName},
  getAll${camelCaseName}s,
  count${camelCaseName}s,
  exists${camelCaseName},
};`;
};
