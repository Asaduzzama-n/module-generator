#!/usr/bin/env node

import { Command } from "commander";
// Make sure these imports are at the top of the file
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

import Handlebars from "handlebars";
import { v4 as uuidv4 } from "uuid";

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
  enumValues?: string[];
  objectProperties?: FieldDefinition[];
  arrayItemType?: string;
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

    if (arg === "--skip") {
      skipMode = true;
      continue;
    }

    if (skipMode) {
      skipFiles.push(arg);
    } else {
      try {
        // Check if the argument contains enum values
        const enumMatch = arg.match(/^([a-zA-Z0-9_]+)\[([^\]]+)\]$/);
        if (enumMatch) {
          // This is an enum field with values in square brackets
          const [, name, enumValues] = enumMatch;
          const enumOptions = enumValues.split(",").map((v) => v.trim());

          fields.push({
            name,
            type: "enum",
            enumValues: enumOptions,
            isRequired: false,
            isOptional: false,
          });
        } else {
          // Process as field definition
          const parts = arg.split(":");

          if (parts.length >= 2) {
            let name = parts[0].trim();
            const type = parts[1].trim().toLowerCase();

            // Check for optional marker (?)
            const isOptional = name.endsWith("?");
            if (isOptional) {
              name = name.slice(0, -1);
            }

            // Check for required marker (!)
            const isRequired = name.endsWith("!");
            if (isRequired) {
              name = name.slice(0, -1);
            }

            // Handle array of objects with properties
            if (
              type === "array" &&
              parts.length > 2 &&
              parts[2].toLowerCase() === "object"
            ) {
              console.log(`Processing array of objects field: ${name}`);

              const objectProperties = [];

              for (let j = 3; j < parts.length; j += 2) {
                if (j + 1 < parts.length) {
                  let propName = parts[j];
                  const propType = parts[j + 1];

                  console.log(`  Property: ${propName}:${propType}`);

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
    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        return `{ type: String, enum: ['${field.enumValues.join("', '")}'] }`;
      }
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

// Function to generate Postman collection for a module
function generatePostmanCollection(
  folderName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  baseUrl: string
) {
  const collection = {
    info: {
      _postman_id: uuidv4(),
      name: `${camelCaseName} API`,
      description: `API endpoints for ${camelCaseName} module`,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      {
        name: `Create ${camelCaseName}`,
        request: {
          method: "POST",
          header: [
            {
              key: "Content-Type",
              value: "application/json",
            },
          ],
          url: {
            raw: `{{baseUrl}}/${folderName}`,
            host: ["{{baseUrl}}"],
            path: [folderName],
          },
          body: {
            mode: "raw",
            raw: JSON.stringify(generateSampleRequestBody(fields), null, 2),
          },
        },
      },
      {
        name: `Get All ${camelCaseName}s`,
        request: {
          method: "GET",
          url: {
            raw: `{{baseUrl}}/${folderName}`,
            host: ["{{baseUrl}}"],
            path: [folderName],
          },
        },
      },
      {
        name: `Get ${camelCaseName} by ID`,
        request: {
          method: "GET",
          url: {
            raw: `{{baseUrl}}/${folderName}/:id`,
            host: ["{{baseUrl}}"],
            path: [folderName, ":id"],
            variable: [
              {
                key: "id",
                value: "{{id}}",
                description: `ID of the ${camelCaseName} to retrieve`,
              },
            ],
          },
        },
      },
      {
        name: `Update ${camelCaseName}`,
        request: {
          method: "PATCH",
          header: [
            {
              key: "Content-Type",
              value: "application/json",
            },
          ],
          url: {
            raw: `{{baseUrl}}/${folderName}/:id`,
            host: ["{{baseUrl}}"],
            path: [folderName, ":id"],
            variable: [
              {
                key: "id",
                value: "{{id}}",
                description: `ID of the ${camelCaseName} to update`,
              },
            ],
          },
          body: {
            mode: "raw",
            raw: JSON.stringify(generateSampleRequestBody(fields), null, 2),
          },
        },
      },
      {
        name: `Delete ${camelCaseName}`,
        request: {
          method: "DELETE",
          url: {
            raw: `{{baseUrl}}/${folderName}/:id`,
            host: ["{{baseUrl}}"],
            path: [folderName, ":id"],
            variable: [
              {
                key: "id",
                value: "{{id}}",
                description: `ID of the ${camelCaseName} to delete`,
              },
            ],
          },
        },
      },
    ],
    variable: [
      {
        key: "baseUrl",
        value: baseUrl,
      },
    ],
  };

  return collection;
}

// Generate sample request body based on field definitions
function generateSampleRequestBody(fields: FieldDefinition[]) {
  const body: Record<string, any> = {};

  fields.forEach((field) => {
    if (field.isOptional) {
      // Skip optional fields in sample
      return;
    }

    switch (field.type.toLowerCase()) {
      case "string":
        body[field.name] = `Sample ${field.name}`;
        break;
      case "number":
        body[field.name] = 123;
        break;
      case "boolean":
        body[field.name] = true;
        break;
      case "date":
        body[field.name] = new Date().toISOString();
        break;
      case "enum":
        if (field.enumValues && field.enumValues.length > 0) {
          body[field.name] = field.enumValues[0];
        } else {
          body[field.name] = "sample_enum_value";
        }
        break;
      case "array":
        if (
          field.ref?.toLowerCase() === "object" &&
          field.objectProperties?.length
        ) {
          body[field.name] = [
            generateNestedObjectSample(field.objectProperties),
          ];
        } else {
          body[field.name] = ["sample_item"];
        }
        break;
      case "object":
        if (field.objectProperties?.length) {
          body[field.name] = generateNestedObjectSample(field.objectProperties);
        } else {
          body[field.name] = { key: "value" };
        }
        break;
      case "objectid":
      case "id":
        body[field.name] = "507f1f77bcf86cd799439011";
        break;
      default:
        body[field.name] = `Sample ${field.name}`;
    }
  });

  return body;
}

// Helper function to generate sample for nested objects
function generateNestedObjectSample(properties: FieldDefinition[]) {
  const obj: Record<string, any> = {};

  properties.forEach((prop) => {
    switch (prop.type.toLowerCase()) {
      case "string":
        obj[prop.name] = `Sample ${prop.name}`;
        break;
      case "number":
        obj[prop.name] = 123;
        break;
      case "boolean":
        obj[prop.name] = true;
        break;
      case "date":
        obj[prop.name] = new Date().toISOString();
        break;
      case "objectid":
      case "id":
        obj[prop.name] = "507f1f77bcf86cd799439011";
        break;
      default:
        obj[prop.name] = `Sample ${prop.name}`;
    }
  });

  return obj;
}

// Save Postman collection to file
function savePostmanCollection(
  folderName: string,
  collection: any,
  outputDir: string = "postman-collections"
) {
  // Create directory if it doesn't exist
  const dirPath = path.join(process.cwd(), outputDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `${folderName}-collection.json`);
  fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));

  return filePath;
}

// Postman API integration functions
async function updatePostmanCollection(
  folderName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  config: PostmanConfig,
  baseUrl: string
): Promise<string> {
  if (!config.apiKey) {
    throw new Error("Postman API key is required");
  }

  const collection = generatePostmanCollection(
    folderName,
    camelCaseName,
    fields,
    baseUrl
  );
  const headers = {
    "X-API-Key": config.apiKey,
    "Content-Type": "application/json",
  };

  // If we have a collection ID, update the existing collection
  if (config.collectionId) {
    const url = `https://api.getpostman.com/collections/${config.collectionId}`;
    await axios.put(url, { collection }, { headers });
    return `Updated existing Postman collection (ID: ${config.collectionId})`;
  }
  // Otherwise create a new collection in the specified workspace
  else if (config.workspaceId) {
    const url = `https://api.getpostman.com/collections?workspace=${config.workspaceId}`;
    const response = await axios.post(url, { collection }, { headers });
    const newCollectionId = response.data.collection.id;
    return `Created new Postman collection (ID: ${newCollectionId}) in workspace (ID: ${config.workspaceId})`;
  } else {
    throw new Error("Either collection ID or workspace ID is required");
  }
}

// Interface for Postman configuration
interface PostmanConfig {
  apiKey: string;
  collectionId?: string;
  workspaceId?: string;
}

// Save Postman configuration to a file
function savePostmanConfig(config: PostmanConfig): void {
  const configDir = path.join(process.cwd(), ".config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, "postman.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Load Postman configuration from a file
function loadPostmanConfig(): PostmanConfig | null {
  const configPath = path.join(process.cwd(), ".config", "postman.json");
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (error) {
      console.warn(
        "Could not load Postman configuration, file exists but is invalid"
      );
    }
  }
  return null;
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
      .option(
        "--postman [dir]",
        "Generate Postman collection file (optional directory path)"
      )
      .option(
        "--postman-api-key <key>",
        "Postman API key for direct integration"
      )
      .option("--postman-collection <id>", "Postman collection ID to update")
      .option(
        "--postman-workspace <id>",
        "Postman workspace ID to create collection in"
      )
      .option(
        "--save-postman-config",
        "Save Postman API configuration for future use"
      )
      .option(
        "--base-url <url>",
        "Base URL for Postman requests",
        "http://localhost:5000/api/v1"
      )
      .allowUnknownOption(true) // Allow field definitions to be passed
      .action(async (name: string, options: any) => {
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

        const result = createModule(name, fields, skipFiles, config);

        // Handle Postman integration
        const baseUrl = options.baseUrl || "http://localhost:5000/api/v1";

        // Check if we should use Postman API integration
        if (
          options.postmanApiKey ||
          options.postmanCollection ||
          options.postmanWorkspace
        ) {
          console.log(`\nUpdating Postman collection via API...`);

          try {
            // Load existing config if available
            let postmanConfig = loadPostmanConfig() || { apiKey: "" };

            // Override with command line options if provided
            if (options.postmanApiKey) {
              postmanConfig.apiKey = options.postmanApiKey;
            }

            if (options.postmanCollection) {
              postmanConfig.collectionId = options.postmanCollection;
            }

            if (options.postmanWorkspace) {
              postmanConfig.workspaceId = options.postmanWorkspace;
            }

            // Save config if requested
            if (options.savePostmanConfig) {
              savePostmanConfig(postmanConfig);
              console.log("✅ Postman configuration saved for future use");
            }

            // Update the collection via API
            const apiResult = await updatePostmanCollection(
              result.folderName,
              result.camelCaseName,
              fields,
              postmanConfig,
              baseUrl
            );

            console.log(`✅ ${apiResult}`);
          } catch (error) {
            console.error(
              "❌ Error updating Postman collection via API:",
              //@ts-ignore
              error.message
            );
            console.log(
              "  Try using --postman-api-key, --postman-collection, and --postman-workspace options"
            );
          }
        }
        // Otherwise use the file-based approach if --postman is specified
        else if (options.postman !== undefined) {
          const postmanDir =
            typeof options.postman === "string"
              ? options.postman
              : "postman-collections";

          console.log(`\nGenerating Postman collection in ${postmanDir}...`);

          try {
            const collection = generatePostmanCollection(
              result.folderName,
              result.camelCaseName,
              fields,
              baseUrl
            );

            const filePath = savePostmanCollection(
              result.folderName,
              collection,
              postmanDir
            );
            console.log(`✅ Postman collection saved to: ${filePath}`);
            console.log(`\nTo use this collection in Postman:`);
            console.log(`1. Open Postman`);
            console.log(`2. Click "Import" button`);
            console.log(`3. Select the file: ${filePath}`);
            console.log(
              `4. Click "Import" to add the collection to your workspace`
            );
            console.log(
              `\nFor direct Postman integration without manual imports, use:`
            );
            console.log(
              `siuuu-create ModuleName --postman-api-key YOUR_API_KEY --postman-collection COLLECTION_ID`
            );
          } catch (error) {
            console.error("❌ Error generating Postman collection:", error);
          }
        }
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
): { folderName: string; camelCaseName: string } {
  const camelCaseName = toCamelCase(name);
  const folderName = camelCaseName.toLowerCase();
  const folderPath = path.join(process.cwd(), config.modulesDir, folderName);

  // Check if the folder already exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created folder: ${folderName}`);
  } else {
    console.log(`Folder ${folderName} already exists.`);
    return { folderName: "", camelCaseName: "" };
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

  // Return module info for further processing
  return { folderName, camelCaseName };
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
  fields: FieldDefinition[]
): string {
  try {
    // First try to find the template in the current directory
    let templatePath = path.join(
      __dirname,
      "templates",
      "controller.template.ts"
    );

    // If not found, try looking in the src directory (for development)
    if (!fs.existsSync(templatePath)) {
      const fallbackPath = path.join(
        process.cwd(),
        "src",
        "templates",
        "controller.template.ts"
      );

      if (fs.existsSync(fallbackPath)) {
        templatePath = fallbackPath;
      } else {
        console.error(
          `Template not found at ${templatePath} or ${fallbackPath}`
        );
        // Handle the error appropriately - maybe use a default template string or exit
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
    let templatePath = path.join(__dirname, "templates", "service.template.ts");

    // If not found, try looking in the src directory (for development)
    if (!fs.existsSync(templatePath)) {
      const fallbackPath = path.join(
        process.cwd(),
        "src",
        "templates",
        "controller.template.js"
      );

      if (fs.existsSync(fallbackPath)) {
        templatePath = fallbackPath;
      } else {
        console.error(
          `Template not found at ${templatePath} or ${fallbackPath}`
        );
        // Handle the error appropriately - maybe use a default template string or exit
        console.error(`Service template file not found: ${templatePath}`);
        // Fallback to basic service if template not found
        return (
          `import { StatusCodes } from 'http-status-codes';\n` +
          `import ApiError from '../../../errors/ApiError';\n` +
          `import { I${camelCaseName} } from './${folderName}.interface';\n` +
          `import { ${camelCaseName} } from './${folderName}.model';\n\n` +
          `const create${camelCaseName} = async (payload: I${camelCaseName}) => {\n` +
          `  const result = await ${camelCaseName}.create(payload);\n` +
          `  if (!result)\n` +
          `    throw new ApiError(\n` +
          `      StatusCodes.BAD_REQUEST,\n` +
          `      'Failed to create ${camelCaseName}',\n` +
          `    );\n` +
          `  return result;\n` +
          `};\n\n` +
          `const getAll${camelCaseName}s = async () => {\n` +
          `  const result = await ${camelCaseName}.find();\n` +
          `  return result;\n` +
          `};\n\n` +
          `const getSingle${camelCaseName} = async (id: string) => {\n` +
          `  const result = await ${camelCaseName}.findById(id);\n` +
          `  return result;\n` +
          `};\n\n` +
          `const update${camelCaseName} = async (\n` +
          `  id: string,\n` +
          `  payload: Partial<I${camelCaseName}>,\n` +
          `) => {\n` +
          `  const result = await ${camelCaseName}.findByIdAndUpdate(\n` +
          `    id,\n` +
          `    { $set: payload },\n` +
          `    {\n` +
          `      new: true,\n` +
          `    },\n` +
          `  );\n` +
          `  return result;\n` +
          `};\n\n` +
          `const delete${camelCaseName} = async (id: string) => {\n` +
          `  const result = await ${camelCaseName}.findByIdAndDelete(id);\n` +
          `  return result;\n` +
          `};\n\n` +
          `export const ${camelCaseName}Services = {\n` +
          `  create${camelCaseName},\n` +
          `  getAll${camelCaseName}s,\n` +
          `  getSingle${camelCaseName},\n` +
          `  update${camelCaseName},\n` +
          `  delete${camelCaseName},\n` +
          `};\n`
        );
      }
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
