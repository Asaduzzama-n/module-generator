#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { FieldDefinition } from "./types";
import Handlebars from "handlebars";

// Import new utilities
import { parseFieldDefinitions } from "./utils/fieldParser";
import { generateInterfaceContent } from "./utils/interfaceGenerator";
import { updateAllDocumentation, updateExistingModulesDocumentation } from "./utils/documentationUpdater";

// Configuration interface
interface ModuleGeneratorConfig {
  modulesDir: string;
  routesFile: string;
}

// Documentation options interface
interface DocumentationOptions {
  updatePostman?: boolean;
  updateSwagger?: boolean;
  postmanDir?: string;
  swaggerFile?: string;
}

// Templates type
type Templates = {
  interface: string;
  model: string;
  controller: string;
  service: string;
  route: string;
  validation: string;
  constants: string;
};

// Default configuration
const defaultConfig: ModuleGeneratorConfig = {
  modulesDir: "src/app/modules",
  routesFile: "src/routes/index.ts",
};

// Load configuration from package.json or use defaults
function loadConfig(): ModuleGeneratorConfig {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const config = packageJson.moduleGenerator || {};
      return {
        modulesDir: config.modulesDir || defaultConfig.modulesDir,
        routesFile: config.routesFile || defaultConfig.routesFile,
      };
    }
  } catch (error) {
    console.warn(
      "Could not load configuration from package.json, using defaults"
    );
  }
  return defaultConfig;
}

function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
      index === 0 ? match.toUpperCase() : match.toLowerCase()
    )
    .replace(/\s+/g, "");
}

// Enhanced model generation with better nested schema support
function generateModelContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface'; \n\n`;

  // Generate nested schemas
  const nestedSchemas = generateNestedSchemas(fields);
  modelContent += nestedSchemas;

  modelContent += `const ${folderName}Schema = new Schema<I${camelCaseName}, ${camelCaseName}Model>({\n`;

  // Add fields to schema
  if (fields.length > 0) {
    fields.forEach((field) => {
      let schemaType = mapToMongooseType(field);
      let additionalProps = "";

      // Add required property if marked as required
      if (field.isRequired) {
        additionalProps += ", required: true";
      }

      modelContent += `  ${field.name}: ${schemaType}${additionalProps},\n`;
    });
  } else {
    modelContent += "  // Define schema fields here\n";
  }

  modelContent += `}, {\n  timestamps: true\n});\n\nexport const ${camelCaseName} = model<I${camelCaseName}, ${camelCaseName}Model>('${camelCaseName}', ${folderName}Schema);\n`;

  return modelContent;
}

// Helper function to generate nested schemas
function generateNestedSchemas(fields: FieldDefinition[]): string {
  let schemas = "";

  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedSchemaName = `${field.name}ItemSchema`;
      schemas += `const ${nestedSchemaName} = new Schema({\n`;

      // Add properties
      field.objectProperties.forEach((prop) => {
        let schemaType = mapToMongooseType(prop);
        let additionalProps = "";

        // Add required property if marked as required
        if (prop.isRequired) {
          additionalProps += ", required: true";
        }

        schemas += `  ${prop.name}: ${schemaType}${additionalProps},\n`;
      });

      schemas += `}, { _id: false });\n\n`;

      // Check for nested objects within this schema
      const nestedSchemas = generateNestedSchemas(field.objectProperties);
      schemas += nestedSchemas;
    }
  });

  return schemas;
}

// Helper function to map field definitions to Mongoose schema types
function mapToMongooseType(field: FieldDefinition): string {
  switch (field.type.toLowerCase()) {
    case "string":
      return "{ type: String }";
    case "number":
      return "{ type: Number }";
    case "boolean":
      return "{ type: Boolean }";
    case "date":
      return "{ type: Date }";
    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        return `{ type: String, enum: ['${field.enumValues.join("', '")}'] }`;
      }
      return "{ type: String }";
    case "array":
      if (
        field.ref?.toLowerCase() === "object" &&
        field.objectProperties?.length
      ) {
        // Array of objects with defined structure
        const nestedSchemaName = `${field.name}ItemSchema`;
        return `[${nestedSchemaName}]`;
      } else if (field.arrayItemType) {
        // Array with specified item type
        switch (field.arrayItemType.toLowerCase()) {
          case "string":
            return "{ type: [String] }";
          case "number":
            return "{ type: [Number] }";
          case "boolean":
            return "{ type: [Boolean] }";
          case "date":
            return "{ type: [Date] }";
          case "objectid":
          case "id":
            return `{ type: [Schema.Types.ObjectId], ref: '${
              field.ref || "Document"
            }' }`;
          default:
            return "{ type: [String] }";
        }
      } else {
        return "{ type: [String] }";
      }
    case "object":
      if (field.objectProperties?.length) {
        // Object with defined properties
        return `{ ${field.objectProperties
          .map((prop) => {
            return `${prop.name}: ${mapToMongooseType(prop)}`;
          })
          .join(", ")} }`;
      } else {
        return "{ type: Schema.Types.Mixed }";
      }
    case "objectid":
    case "id":
      return field.ref
        ? `{ type: Schema.Types.ObjectId, ref: '${field.ref}' }`
        : "{ type: Schema.Types.ObjectId }";
    default:
      return "{ type: String }";
  }
}

// Enhanced validation generation
function generateValidationContent(
  camelCaseName: string,
  fields: FieldDefinition[]
): string {
  let validationContent = `import { z } from 'zod';\n\n`;

  // Add nested schemas for array of objects
  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedSchemaName = `${field.name}ItemSchema`;
      validationContent += `const ${nestedSchemaName} = z.object({\n`;

      // Add properties from the objectProperties array
      field.objectProperties.forEach((prop) => {
        let zodType = mapToZodType(prop.type, prop);

        // Add required/optional modifiers
        if (prop.isRequired) {
          // Already required by default in Zod
        } else if (prop.isOptional) {
          zodType += ".optional()";
        }

        validationContent += `  ${prop.name}: ${zodType},\n`;
      });

      validationContent += `});\n\n`;
    }
  });

  validationContent += `export const ${camelCaseName}Validations = {\n`;

  // Create validation schema
  validationContent += `  create: z.object({\n`;

  // Add validation for each field
  if (fields.length > 0) {
    fields.forEach((field) => {
      let zodType = mapToZodType(field.type, field);

      // Add required/optional modifiers
      if (field.isRequired) {
        // Already required by default in Zod
      } else if (field.isOptional) {
        zodType += ".optional()";
      }

      validationContent += `    ${field.name}: ${zodType},\n`;
    });
  } else {
    validationContent += `    // Add validation fields\n`;
  }

  validationContent += `  }),\n\n`;

  // Add update validation schema (similar to create but all fields optional)
  validationContent += `  update: z.object({\n`;

  if (fields.length > 0) {
    fields.forEach((field) => {
      let zodType = mapToZodType(field.type, field);

      // All fields are optional in update
      zodType += ".optional()";

      validationContent += `    ${field.name}: ${zodType},\n`;
    });
  } else {
    validationContent += `    // Add validation fields\n`;
  }

  validationContent += `  }),\n};\n`;

  return validationContent;
}

// Helper function to map types to Zod validators
function mapToZodType(type: string, field?: FieldDefinition): string {
  switch (type.toLowerCase()) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "date":
      return "z.string().datetime()";
    case "enum":
      if (field?.enumValues && field.enumValues.length > 0) {
        return `z.enum(['${field.enumValues.join("', '")}'])`;
      }
      return "z.string()";
    case "array":
      if (field?.ref) {
        if (
          field.ref.toLowerCase() === "object" &&
          field.objectProperties?.length
        ) {
          // Array of objects with defined structure
          const nestedSchemaName = `${field.name}ItemSchema`;
          return `z.array(${nestedSchemaName})`;
        } else {
          // Array of references to other models
          return "z.array(z.string())";
        }
      } else {
        return "z.array(z.string())";
      }
    case "object":
      return "z.record(z.string(), z.any())";
    case "objectid":
    case "id":
      return "z.string()"; // ObjectId as string
    default:
      return "z.string()";
  }
}

// Enhanced controller generation
function generateControllerContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
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

export const ${camelCaseName}Controller = {
  create${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
  get${camelCaseName},
  getAll${camelCaseName}s,
};`;
}

// Enhanced service generation
function generateServiceContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.type.toLowerCase() === "image"
  );

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

export const ${camelCaseName}Services = {
  create${camelCaseName},
  update${camelCaseName},
  delete${camelCaseName},
  get${camelCaseName},
  getAll${camelCaseName}s,
};`;
}

// Enhanced route generation
function generateRouteContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  const hasImageField = fields.some(
    (field) => field.name === "image" || field.type.toLowerCase() === "image"
  );

  return `import express from 'express';
import { ${camelCaseName}Controller } from './${folderName}.controller';
import validateRequest from '../../../middlewares/validateRequest';
import { ${camelCaseName}Validations } from './${folderName}.validation';
${hasImageField ? `import { FileUploadHelper } from '../../../helpers/FileUploadHelper';` : ""}

const router = express.Router();

router.post(
  '/',
  ${hasImageField ? `FileUploadHelper.upload.single('image'),` : ""}
  validateRequest(${camelCaseName}Validations.create),
  ${camelCaseName}Controller.create${camelCaseName},
);

router.get('/', ${camelCaseName}Controller.getAll${camelCaseName}s);

router.get('/:id', ${camelCaseName}Controller.get${camelCaseName});

router.patch(
  '/:id',
  ${hasImageField ? `FileUploadHelper.upload.single('image'),` : ""}
  validateRequest(${camelCaseName}Validations.update),
  ${camelCaseName}Controller.update${camelCaseName},
);

router.delete('/:id', ${camelCaseName}Controller.delete${camelCaseName});

export const ${camelCaseName}Routes = router;`;
}

// Enhanced createModule function with documentation generation
function createModule(
  name: string,
  fields: FieldDefinition[],
  skipFiles: string[],
  config: ModuleGeneratorConfig,
  docOptions: DocumentationOptions = {}
): void {
  const camelCaseName = toCamelCase(name);
  const folderName = camelCaseName.toLowerCase();
  const folderPath = path.join(process.cwd(), config.modulesDir, folderName);

  // Check if the folder already exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Created folder: ${folderName}`);
  } else {
    console.log(`⚠️  Folder ${folderName} already exists.`);
    return;
  }

  // Generate content using enhanced generators
  const templates: Templates = {
    interface: generateInterfaceContent(camelCaseName, fields),
    model: generateModelContent(camelCaseName, folderName, fields),
    controller: generateControllerContent(camelCaseName, folderName, fields),
    service: generateServiceContent(camelCaseName, folderName, fields),
    route: generateRouteContent(camelCaseName, folderName, fields),
    validation: generateValidationContent(camelCaseName, fields),
    constants: `export const ${camelCaseName.toUpperCase()}_CONSTANT = 'someValue';\n`,
  };

  // Create each file, skipping those specified in skipFiles
  Object.entries(templates).forEach(([key, content]) => {
    // Skip if this file type is in the skipFiles array
    if (skipFiles.includes(key)) {
      console.log(`⏭️  Skipping file: ${folderName}.${key}.ts`);
      return;
    }

    const filePath = path.join(folderPath, `${folderName}.${key}.ts`);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created file: ${filePath}`);
  });

  // Add the new module to the central router file
  updateRouterFile(folderName, camelCaseName, config);

  // Generate documentation
  if (docOptions.updatePostman || docOptions.updateSwagger) {
    console.log(`\n📚 Generating documentation for ${camelCaseName}...`);
    updateAllDocumentation(camelCaseName, fields, docOptions);
  }

  console.log(`\n🎉 Module '${camelCaseName}' created successfully!`);
}

// Update router file function
function updateRouterFile(
  folderName: string,
  camelCaseName: string,
  config: ModuleGeneratorConfig
): void {
  const routerFilePath = path.join(process.cwd(), config.routesFile);

  // Check if the router file exists
  if (!fs.existsSync(routerFilePath)) {
    console.warn(`⚠️  Router file not found: ${routerFilePath}`);
    return;
  }

  try {
    let routerContent = fs.readFileSync(routerFilePath, "utf-8");

    // Check if the import already exists
    const importStatement = `import { ${camelCaseName}Routes } from '../app/modules/${folderName}/${folderName}.route'`;
    if (!routerContent.includes(importStatement)) {
      // Find the last import statement
      const lastImportIndex = routerContent.lastIndexOf("import ");
      const lastImportEndIndex = routerContent.indexOf("\n", lastImportIndex);

      if (lastImportIndex !== -1) {
        // Insert the new import after the last import
        routerContent =
          routerContent.slice(0, lastImportEndIndex + 1) +
          importStatement +
          "\n" +
          routerContent.slice(lastImportEndIndex + 1);
      } else {
        // No imports found, add at the beginning
        routerContent = importStatement + "\n" + routerContent;
      }
    }

    // Check if the route registration already exists in the apiRoutes array
    const routeRegistration = `{ path: '/${folderName}', route: ${camelCaseName}Routes }`;

    if (!routerContent.includes(routeRegistration)) {
      // Find the apiRoutes array initialization (after the equals sign)
      const apiRoutesDeclaration = routerContent.indexOf("const apiRoutes");
      if (apiRoutesDeclaration !== -1) {
        // Find the equals sign
        const equalsSignIndex = routerContent.indexOf(
          "=",
          apiRoutesDeclaration
        );
        if (equalsSignIndex !== -1) {
          // Find the opening bracket of the array initialization
          const arrayStartIndex = routerContent.indexOf("[", equalsSignIndex);
          // Find the closing bracket of the array
          const arrayEndIndex = routerContent.indexOf("]", arrayStartIndex);

          if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
            // Check if there are existing routes
            const arrayContent = routerContent.substring(
              arrayStartIndex,
              arrayEndIndex
            );
            const hasRoutes = arrayContent.includes("{");

            // Insert the new route at the end of the array
            const insertPosition = arrayEndIndex;
            const insertText = hasRoutes
              ? `,\n  ${routeRegistration}`
              : `  ${routeRegistration}`;

            routerContent =
              routerContent.slice(0, insertPosition) +
              insertText +
              routerContent.slice(insertPosition);
          }
        }
      } else {
        console.warn("Could not find apiRoutes array in router file");
      }
    }

    // Write the updated content back to the file
    fs.writeFileSync(routerFilePath, routerContent);
    console.log(`✅ Updated router file: ${routerFilePath}`);
  } catch (error) {
    console.error(`❌ Error updating router file: ${error}`);
  }
}

// Main function with enhanced CLI
function main() {
  try {
    const config = loadConfig();
    const program = new Command();

    program
      .name("leo-generate")
      .description("Enhanced Express module generator with Mongoose models")
      .version("1.0.9");

    // Main module generation command
    program
      .command("generate")
      .alias("g")
      .argument("<name>", "Module name")
      .option("-c, --config <path>", "Path to custom config file")
      .option("--modules-dir <path>", "Path to modules directory")
      .option("--routes-file <path>", "Path to routes file")
      .option("--no-postman", "Skip Postman collection generation")
      .option("--no-swagger", "Skip Swagger documentation generation")
      .option("--postman-dir <path>", "Custom Postman output directory", "postman")
      .option("--swagger-file <path>", "Custom Swagger file path", "swagger.json")
      .allowUnknownOption(true)
      .action((name: string, options: any) => {
        // Override config with CLI options
        if (options.modulesDir) {
          config.modulesDir = options.modulesDir;
        }
        if (options.routesFile) {
          config.routesFile = options.routesFile;
        }

        // Get field definitions from remaining arguments
        const fieldArgs = program.args.slice(2); // Skip 'generate' and module name
        console.log("Processing field arguments:", fieldArgs);

        const { fields, skipFiles } = parseFieldDefinitions(fieldArgs);

        if (fields.length === 0) {
          console.log("⚠️  No fields were parsed. Check your command syntax.");
          console.log("Example: leo-generate generate User name:string email:string age:number");
          return;
        }

        createModule(name, fields, skipFiles, config, {
          updatePostman: options.postman !== false,
          updateSwagger: options.swagger !== false,
          postmanDir: options.postmanDir,
          swaggerFile: options.swaggerFile
        });
      });

    // Documentation update command
    program
      .command("update-docs")
      .alias("docs")
      .description("Update Postman and Swagger documentation for existing modules")
      .option("--modules-dir <path>", "Path to modules directory", "src/app/modules")
      .option("--no-postman", "Skip Postman collection generation")
      .option("--no-swagger", "Skip Swagger documentation generation")
      .option("--postman-dir <path>", "Custom Postman output directory", "postman")
      .option("--swagger-file <path>", "Custom Swagger file path", "swagger.json")
      .action((options: any) => {
        updateExistingModulesDocumentation(options.modulesDir, {
          updatePostman: options.postman !== false,
          updateSwagger: options.swagger !== false,
          postmanDir: options.postmanDir,
          swaggerFile: options.swaggerFile
        });
      });

    // Legacy support - direct module generation (backward compatibility)
    program
      .argument("[name]", "Module name (legacy support)")
      .allowUnknownOption(true)
      .action((name?: string) => {
        if (name && !["generate", "g", "update-docs", "docs"].includes(name)) {
          // Legacy mode - treat first argument as module name
          const fieldArgs = program.args.slice(1);
          console.log("Legacy mode - Processing field arguments:", fieldArgs);

          const { fields, skipFiles } = parseFieldDefinitions(fieldArgs);

          if (fields.length === 0) {
            console.log("⚠️  No fields were parsed. Check your command syntax.");
            console.log("Example: leo-generate User name:string email:string age:number");
            return;
          }

          createModule(name, fields, skipFiles, config, {
            updatePostman: true,
            updateSwagger: true,
            postmanDir: "postman",
            swaggerFile: "swagger.json"
          });
        }
      });

    program.parse();
  } catch (error) {
    console.error("❌ Error executing command:", error);
    process.exit(1);
  }
}

// Call the main function to start the CLI
main();