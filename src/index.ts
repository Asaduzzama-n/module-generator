#!/usr/bin/env node

import { Command } from "commander";
// Make sure these imports are at the top of the file
import * as fs from "fs";
import * as path from "path";

import Handlebars from "handlebars";

// Configuration interface
interface ModuleGeneratorConfig {
  modulesDir: string;
  routesFile: string;
}

// Field definition interface
// Enhanced field definition interface to support nested object properties
// Update the FieldDefinition interface to properly support object properties
interface FieldDefinition {
  name: string;
  type: string;
  ref?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  objectProperties?: FieldDefinition[]; // Changed to support nested field definitions
  arrayItemType?: string; // Type of items in an array
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

function parseFieldDefinitions(args: string[]): {
  fields: FieldDefinition[];
  skipFiles: string[];
} {
  const fields: FieldDefinition[] = [];
  const skipFiles: string[] = [];
  let skipMode = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Check if we've reached the skip flag
    if (arg === "--skip") {
      skipMode = true;
      continue;
    }

    if (skipMode) {
      // Add to skip files list
      skipFiles.push(arg);
    } else {
      try {
        // Process as field definition
        const parts = arg.split(":");

        if (parts.length >= 2) {
          let name = parts[0].trim();
          const type = parts[1].trim().toLowerCase();

          // Check for optional marker (?)
          const isOptional = name.endsWith("?");
          if (isOptional) {
            name = name.slice(0, -1); // Remove the ? from the name
          }

          // Check for required marker (!)
          const isRequired = name.endsWith("!");
          if (isRequired) {
            name = name.slice(0, -1); // Remove the ! from the name
          }

          // Handle array of objects with properties
          if (
            type === "array" &&
            parts.length > 2 &&
            parts[2].toLowerCase() === "object"
          ) {
            console.log(`Processing array of objects field: ${name}`);

            // This is an array of objects with properties
            const objectProperties = [];

            // Process object properties (starting from index 3)
            for (let j = 3; j < parts.length; j += 2) {
              if (j + 1 < parts.length) {
                let propName = parts[j];
                const propType = parts[j + 1];

                console.log(`  Property: ${propName}:${propType}`);

                // Check for optional/required markers in property name
                const propIsOptional = propName.endsWith("?");
                const propIsRequired = propName.endsWith("!");

                if (propIsOptional) {
                  propName = propName.slice(0, -1);
                }
                if (propIsRequired) {
                  propName = propName.slice(0, -1);
                }

                objectProperties.push({
                  name: propName,
                  type: propType,
                  isOptional: propIsOptional,
                  isRequired: propIsRequired,
                });
              }
            }

            fields.push({
              name,
              type,
              ref: "object",
              isRequired,
              isOptional,
              objectProperties,
            });

            console.log(
              `Added field with ${objectProperties.length} properties`
            );
          } else {
            // Regular field
            const ref = parts.length > 2 ? parts[2].trim() : undefined;
            fields.push({ name, type, ref, isRequired, isOptional });
            console.log(
              `Added regular field: ${name}:${type}${ref ? `:${ref}` : ""}`
            );
          }
        }
      } catch (error) {
        console.error(`Error parsing field definition: ${arg}`, error);
      }
    }
  }

  console.log("Parsed fields:", JSON.stringify(fields, null, 2));
  return { fields, skipFiles };
}

// Update the generateInterfaceContent function to properly handle object properties
function generateInterfaceContent(
  camelCaseName: string,
  fields: FieldDefinition[]
): string {
  let interfaceContent = `import { Model, Types } from 'mongoose';\n\n`;

  // Generate nested interfaces for complex types
  const nestedInterfaces = generateNestedInterfaces(fields);
  interfaceContent += nestedInterfaces;

  interfaceContent += `export type I${camelCaseName} = {\n`;

  // Add fields to interface
  if (fields.length > 0) {
    fields.forEach((field) => {
      let tsType = mapToTypeScriptType(field);

      // Add optional marker to the interface field if needed
      const optionalMarker = field.isOptional ? "?" : "";
      interfaceContent += `  ${field.name}${optionalMarker}: ${tsType};\n`;
    });
  } else {
    interfaceContent += "  // Define the interface for ${camelCaseName} here\n";
  }

  interfaceContent += `};\n\nexport type ${camelCaseName}Model = Model<I${camelCaseName}>;\n`;

  return interfaceContent;
}

// Helper function to generate nested interfaces
function generateNestedInterfaces(fields: FieldDefinition[]): string {
  let interfaces = "";

  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
      interfaces += `export interface ${nestedInterfaceName} {\n`;

      // Add properties
      field.objectProperties.forEach((prop) => {
        let tsType = mapToTypeScriptType(prop);
        const optionalMarker = prop.isOptional ? "?" : "";
        interfaces += `  ${prop.name}${optionalMarker}: ${tsType};\n`;
      });

      interfaces += `}\n\n`;

      // Check for nested objects within this interface
      const nestedInterfaces = generateNestedInterfaces(field.objectProperties);
      interfaces += nestedInterfaces;
    }
  });

  return interfaces;
}

// Helper function to map field definitions to TypeScript types
function mapToTypeScriptType(field: FieldDefinition): string {
  switch (field.type.toLowerCase()) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "Date";
    case "array":
      if (
        field.ref?.toLowerCase() === "object" &&
        field.objectProperties?.length
      ) {
        // Array of objects with defined structure
        const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
        return `${nestedInterfaceName}[]`;
      } else if (field.arrayItemType) {
        // Array with specified item type
        switch (field.arrayItemType.toLowerCase()) {
          case "string":
            return "string[]";
          case "number":
            return "number[]";
          case "boolean":
            return "boolean[]";
          case "date":
            return "Date[]";
          case "objectid":
          case "id":
            return "Types.ObjectId[]";
          default:
            return "string[]"; // Default to string[] instead of any[]
        }
      } else {
        return "string[]"; // Default to string[] instead of any[]
      }
    case "object":
      if (field.objectProperties?.length) {
        // Object with defined properties
        return `{ ${field.objectProperties
          .map((prop) => {
            const optionalMarker = prop.isOptional ? "?" : "";
            return `${prop.name}${optionalMarker}: ${mapToTypeScriptType(
              prop
            )}`;
          })
          .join("; ")} }`;
      } else {
        return "Record<string, any>";
      }
    case "objectid":
    case "id":
      return "Types.ObjectId";
    default:
      return "string"; // Default to string instead of any
  }
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
            return "{ type: [String] }"; // Default to String instead of Mixed
        }
      } else {
        return "{ type: [String] }"; // Default to String instead of Mixed
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
      return "{ type: String }"; // Default to String instead of Mixed
  }
}

// Remove the second implementation of generateNestedInterfaces (around line 218)
// Remove the second implementation of generateNestedSchemas (around line 300)
// Remove the second implementation of mapToMongooseType (around line 350)

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

// Update the model generation to handle complex nested structures
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
        let zodType = mapToZodType(prop.type);

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
        return "z.array(z.any())";
      }
    case "object":
      return "z.record(z.string(), z.any())";
    case "objectid":
    case "id":
      return "z.string()"; // ObjectId as string
    default:
      return "z.any()";
  }
}

// Update the main function to properly handle the command arguments
function main() {
  try {
    const config = loadConfig();
    const program = new Command();

    program
      .name("create-module")
      .description("Generate Express module files with Mongoose models")
      .version("1.0.8")
      .argument("<name>", "Module name")
      .option("-c, --config <path>", "Path to custom config file")
      .option("--modules-dir <path>", "Path to modules directory")
      .option("--routes-file <path>", "Path to routes file")
      .allowUnknownOption(true) // Allow field definitions to be passed
      .action((name: string, options: any) => {
        // Override config with CLI options
        if (options.modulesDir) {
          config.modulesDir = options.modulesDir;
        }
        if (options.routesFile) {
          config.routesFile = options.routesFile;
        }

        // Get field definitions from remaining arguments
        const fieldArgs = program.args.slice(1);
        console.log("Processing field arguments:", fieldArgs);

        const { fields, skipFiles } = parseFieldDefinitions(fieldArgs);

        if (fields.length === 0) {
          console.log("No fields were parsed. Check your command syntax.");
          return;
        }

        createModule(name, fields, skipFiles, config);
      });

    program.parse();
  } catch (error) {
    console.error("Error executing command:", error);
    process.exit(1);
  }
}

// Update the createModule function to use the template-based content generators
function createModule(
  name: string,
  fields: FieldDefinition[],
  skipFiles: string[],
  config: ModuleGeneratorConfig
): void {
  const camelCaseName = toCamelCase(name);
  const folderName = camelCaseName.toLowerCase();
  const folderPath = path.join(process.cwd(), config.modulesDir, folderName);

  // Check if the folder already exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created folder: ${folderName}`);
  } else {
    console.log(`Folder ${folderName} already exists.`);
    return;
  }

  // Generate content using template-based generators
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
      console.log(`Skipping file: ${folderName}.${key}.ts`);
      return;
    }

    const filePath = path.join(folderPath, `${folderName}.${key}.ts`);
    fs.writeFileSync(filePath, content);
    console.log(`Created file: ${filePath}`);
  });

  // Add the new module to the central router file
  updateRouterFile(folderName, camelCaseName, config);
}

// Make sure the updateRouterFile function is properly implemented
function updateRouterFile(
  folderName: string,
  camelCaseName: string,
  config: ModuleGeneratorConfig
): void {
  const routerFilePath = path.join(process.cwd(), config.routesFile);

  // Check if the router file exists
  if (!fs.existsSync(routerFilePath)) {
    console.warn(`Router file not found: ${routerFilePath}`);
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
    console.log(`Updated router file: ${routerFilePath}`);
  } catch (error) {
    console.error(`Error updating router file: ${error}`);
  }
}

// Call the main function to start the CLI
main();

// Update the controller generation function
function generateControllerContent(
  camelCaseName: string,
  folderName: string,
  fields: any[]
): string {
  try {
    // First try to find the template in the current directory
    let templatePath = path.join(
      __dirname,
      "templates",
      "controller.template.hbs"
    );

    // If not found, try looking in the src directory (for development)
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "controller.template.hbs"
      );
    }

    if (!fs.existsSync(templatePath)) {
      console.error(`Controller template file not found: ${templatePath}`);
      // Fallback to basic controller if template not found
      return `import { Request, Response } from 'express';
import { ${camelCaseName}Services } from './${folderName}.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const create${camelCaseName} = catchAsync(async (req: Request, res: Response) => {
  const ${folderName}Data = req.body;
  const result = await ${camelCaseName}Services.create${camelCaseName}(${folderName}Data);
  
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
  const result = await ${camelCaseName}Services.getAll${camelCaseName}s();
  
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
    }

    const templateContent = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateContent);

    const { hasFileFields, fileFields, hasParentId } = detectFileFields(fields);

    return template({
      camelCaseName,
      camelCaseNameLower:
        camelCaseName.charAt(0).toLowerCase() + camelCaseName.slice(1),
      folderName,
      hasFileFields,
      fileFields,
      hasParentId,
    });
  } catch (error) {
    console.error("Error generating controller content:", error);
    return "// Error generating controller content";
  }
}

// Update the service generation function
function generateServiceContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  try {
    // First try to find the template in the current directory
    let templatePath = path.join(
      __dirname,
      "templates",
      "service.template.hbs"
    );

    // If not found, try looking in the src directory (for development)
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "service.template.hbs"
      );
    }

    if (!fs.existsSync(templatePath)) {
      console.error(`Service template file not found: ${templatePath}`);
      // Fallback to basic service if template not found
      return (
        `import { I${camelCaseName} } from './${folderName}.interface';\n` +
        `import { ${camelCaseName} } from './${folderName}.model';\n\n` +
        `export const ${camelCaseName}Services = {\n` +
        `  create${camelCaseName}: async (payload: I${camelCaseName}) => {\n` +
        `    const result = await ${camelCaseName}.create(payload);\n` +
        `    return result;\n` +
        `  },\n` +
        `  getAll${camelCaseName}s: async () => {\n` +
        `    const result = await ${camelCaseName}.find();\n` +
        `    return result;\n` +
        `  },\n` +
        `  getSingle${camelCaseName}: async (id: string) => {\n` +
        `    const result = await ${camelCaseName}.findById(id);\n` +
        `    return result;\n` +
        `  },\n` +
        `  update${camelCaseName}: async (id: string, payload: Partial<I${camelCaseName}>) => {\n` +
        `    const result = await ${camelCaseName}.findByIdAndUpdate(id, payload, { new: true });\n` +
        `    return result;\n` +
        `  },\n` +
        `  delete${camelCaseName}: async (id: string) => {\n` +
        `    const result = await ${camelCaseName}.findByIdAndDelete(id);\n` +
        `    return result;\n` +
        `  },\n` +
        `};\n`
      );
    }

    const templateContent = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateContent);

    const { hasFileFields, fileFields, hasParentId, parentField } =
      detectFileFields(fields);

    return template({
      camelCaseName,
      camelCaseNameLower:
        camelCaseName.charAt(0).toLowerCase() + camelCaseName.slice(1),
      folderName,
      hasFileFields,
      fileFields,
      hasParentId,
      parentField,
    });
  } catch (error) {
    console.error("Error generating service content:", error);
    return "// Error generating service content";
  }
}

// Update the route generation function
function generateRouteContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  try {
    // First try to find the template in the current directory
    let templatePath = path.join(__dirname, "templates", "route.template.hbs");

    // If not found, try looking in the src directory (for development)
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "route.template.hbs"
      );
    }

    if (!fs.existsSync(templatePath)) {
      console.error(`Route template file not found: ${templatePath}`);
      // Fallback to basic route if template not found
      return (
        `import express from 'express';\n` +
        `import { ${camelCaseName}Controller } from './${folderName}.controller';\n\n` +
        `const router = express.Router();\n\n` +
        `router.post('/', ${camelCaseName}Controller.create${camelCaseName});\n` +
        `router.get('/', ${camelCaseName}Controller.getAll${camelCaseName}s);\n` +
        `router.get('/:id', ${camelCaseName}Controller.getSingle${camelCaseName});\n` +
        `router.patch('/:id', ${camelCaseName}Controller.update${camelCaseName});\n` +
        `router.delete('/:id', ${camelCaseName}Controller.delete${camelCaseName});\n\n` +
        `export const ${camelCaseName}Routes = router;\n`
      );
    }

    const templateContent = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateContent);

    const { hasFileFields, hasParentId, parentField } =
      detectFileFields(fields);

    return template({
      camelCaseName,
      camelCaseNameLower:
        camelCaseName.charAt(0).toLowerCase() + camelCaseName.slice(1),
      folderName,
      hasFileFields,
      hasParentId,
      parentField,
    });
  } catch (error) {
    console.error("Error generating route content:", error);
    return "// Error generating route content";
  }
}

// Add this function to detect file fields
function detectFileFields(fields: any[]): {
  hasFileFields: boolean;
  fileFields: any[];
  hasParentId: boolean;
  parentField: string;
} {
  const fileFields = [];
  let hasParentId = false;
  let parentField = "";

  for (const field of fields) {
    if (
      field.type.toLowerCase() === "array" &&
      (field.name.includes("image") ||
        field.name.includes("file") ||
        field.name.includes("media") ||
        field.name.includes("video"))
    ) {
      // Determine the input field name based on common patterns
      let inputName = "";
      if (field.name.includes("image")) inputName = "image";
      else if (field.name.includes("video")) inputName = "media";
      else if (field.name.includes("file")) inputName = "files";
      else inputName = field.name;

      fileFields.push({
        name: inputName,
        arrayName: field.name,
      });
    } else if (
      field.name.includes("image") ||
      field.name.includes("file") ||
      field.name.includes("media") ||
      field.name.includes("video")
    ) {
      // Handle single file fields
      fileFields.push({
        name: field.name,
        arrayName: field.name,
      });
    }

    // Check for potential parent ID fields
    if (
      field.type.toLowerCase() === "objectid" &&
      (field.name.includes("parent") ||
        field.name.includes("service") ||
        field.name.includes("category") ||
        field.name.includes("user"))
    ) {
      hasParentId = true;
      parentField = field.name;
    }
  }

  return {
    hasFileFields: fileFields.length > 0,
    fileFields,
    hasParentId,
    parentField,
  };
}
