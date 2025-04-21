#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Command } from "commander";

// Configuration interface
interface ModuleGeneratorConfig {
  modulesDir: string;
  routesFile: string;
}

// Field definition interface
// Enhanced field definition interface to support nested object properties
interface FieldDefinition {
  name: string;
  type: string;
  ref?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  objectProperties?: {
    name: string;
    type: string;
    isRequired?: boolean;
    isOptional?: boolean;
  }[];
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
  let currentField: FieldDefinition | null = null;

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
      // Check if this is a field definition or a property of an object field
      const parts = arg.split(":");

      if (parts.length >= 2) {
        let name = parts[0].trim();
        const type = parts[1].trim();
        const ref = parts.length > 2 ? parts[2].trim() : undefined;

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

        // If this is an array of objects with properties defined
        if (
          type.toLowerCase() === "array" &&
          ref?.toLowerCase() === "object" &&
          parts.length > 3
        ) {
          currentField = {
            name,
            type,
            ref,
            isRequired,
            isOptional,
            objectProperties: [],
          };
          fields.push(currentField);

          // Process the first property of the object
          if (parts.length >= 5) {
            const propName = parts[3];
            const propType = parts[4];

            // Check for optional/required markers in property name
            let propertyName = propName;
            const propIsOptional = propertyName.endsWith("?");
            const propIsRequired = propertyName.endsWith("!");

            if (propIsOptional) {
              propertyName = propertyName.slice(0, -1);
            }
            if (propIsRequired) {
              propertyName = propertyName.slice(0, -1);
            }

            currentField.objectProperties!.push({
              name: propertyName,
              type: propType,
              isOptional: propIsOptional,
              isRequired: propIsRequired,
            });
          }
        } else if (
          currentField &&
          currentField.type.toLowerCase() === "array" &&
          currentField.ref?.toLowerCase() === "object" &&
          parts.length >= 2
        ) {
          // This is a property definition for the current object field
          const propName = parts[0];
          const propType = parts[1];

          // Check for optional/required markers in property name
          let propertyName = propName;
          const propIsOptional = propertyName.endsWith("?");
          const propIsRequired = propertyName.endsWith("!");

          if (propIsOptional) {
            propertyName = propertyName.slice(0, -1);
          }
          if (propIsRequired) {
            propertyName = propertyName.slice(0, -1);
          }

          currentField.objectProperties!.push({
            name: propertyName,
            type: propType,
            isOptional: propIsOptional,
            isRequired: propIsRequired,
          });
        } else {
          // This is a new field definition
          currentField = null;
          fields.push({ name, type, ref, isRequired, isOptional });
        }
      }
    }
  }

  return { fields, skipFiles };
}

function generateInterfaceContent(
  camelCaseName: string,
  fields: FieldDefinition[]
): string {
  let interfaceContent = `import { Model, Types } from 'mongoose';\n\n`;

  // Add nested interfaces for array of objects
  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
      interfaceContent += `export interface ${nestedInterfaceName} {\n`;

      // Add properties from the objectProperties array
      field.objectProperties.forEach((prop) => {
        let tsType = mapToTypeScriptType(prop.type);
        const optionalMarker = prop.isOptional ? "?" : "";
        interfaceContent += `  ${prop.name}${optionalMarker}: ${tsType};\n`;
      });

      interfaceContent += `}\n\n`;
    }
  });

  interfaceContent += `export type I${camelCaseName} = {\n`;

  // Add fields to interface
  if (fields.length > 0) {
    fields.forEach((field) => {
      let tsType = mapToTypeScriptType(field.type, field);

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

// Helper function to map types to TypeScript types
function mapToTypeScriptType(type: string, field?: FieldDefinition): string {
  switch (type.toLowerCase()) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "Date";
    case "array":
      // If it's an array with a reference
      if (field?.ref) {
        if (
          field.ref.toLowerCase() === "object" &&
          field.objectProperties?.length
        ) {
          // Array of objects with defined structure
          const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
          return `${nestedInterfaceName}[]`;
        } else {
          // Array of references to other models
          return `Types.ObjectId[]`;
        }
      } else {
        return "any[]";
      }
    case "object":
      return "Record<string, any>";
    case "objectid":
    case "id":
      return "Types.ObjectId";
    default:
      return "any";
  }
}

function generateModelContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface'; \n\n`;

  // Add nested schemas for array of objects
  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedSchemaName = `${field.name}ItemSchema`;
      modelContent += `const ${nestedSchemaName} = new Schema({\n`;

      // Add properties from the objectProperties array
      field.objectProperties.forEach((prop) => {
        let schemaType = mapToMongooseType(prop.type);
        let additionalProps = "";

        // Add required property if marked as required
        if (prop.isRequired) {
          additionalProps += ", required: true";
        }

        modelContent += `  ${prop.name}: { type: ${schemaType}${additionalProps} },\n`;
      });

      modelContent += `}, { _id: false });\n\n`;
    }
  });

  modelContent += `const ${folderName}Schema = new Schema<I${camelCaseName}, ${camelCaseName}Model>({\n`;

  // Add fields to schema
  if (fields.length > 0) {
    fields.forEach((field) => {
      let schemaType = mapToMongooseType(field.type, field);
      let additionalProps = "";

      // Add required property if marked as required
      if (field.isRequired) {
        additionalProps += ", required: true";
      }

      modelContent += `  ${field.name}: { type: ${schemaType}${additionalProps} },\n`;
    });
  } else {
    modelContent += "  // Define schema fields here\n";
  }

  modelContent += `}, {\n  timestamps: true\n});\n\nexport const ${camelCaseName} = model<I${camelCaseName}, ${camelCaseName}Model>('${camelCaseName}', ${folderName}Schema);\n`;

  return modelContent;
}

// Helper function to map types to Mongoose schema types
function mapToMongooseType(type: string, field?: FieldDefinition): string {
  switch (type.toLowerCase()) {
    case "string":
      return "String";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
    case "date":
      return "Date";
    case "array":
      if (field?.ref) {
        if (
          field.ref.toLowerCase() === "object" &&
          field.objectProperties?.length
        ) {
          // Array of objects with defined structure
          const nestedSchemaName = `${field.name}ItemSchema`;
          return `[${nestedSchemaName}]`;
        } else {
          // Array of references to other models
          return "[Schema.Types.ObjectId]";
        }
      } else {
        return "[Schema.Types.Mixed]";
      }
    case "object":
      return "Schema.Types.Mixed";
    case "objectid":
    case "id":
      return "Schema.Types.ObjectId";
    default:
      return "String";
  }
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

// ... rest of the code ...
