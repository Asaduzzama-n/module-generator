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
import { generateFileHelper } from "./utils/helperGenerator";

// Import template generators
import { generateRouteContent } from "./templates/route.template";
import { generateConstantsContent } from "./templates/constants.template";
import { generateControllerContent } from "./templates/controller.template";
import { generateServiceContent } from "./templates/service.template";

// Configuration interface
interface ModuleGeneratorConfig {
  modulesDir: string;
  routesFile: string;
  postmanApiKey?: string;
  postmanCollectionId?: string;
}

// Documentation options interface
interface DocumentationOptions {
  updatePostman?: boolean;
  updateSwagger?: boolean;
  postmanDir?: string;
  swaggerFile?: string;
  postmanApiKey?: string;
  postmanCollectionId?: string;
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
  const config: ModuleGeneratorConfig = { ...defaultConfig };

  // 1. Try to load from .env file in the current directory
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const lines = envContent.split("\n");
      lines.forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
          if (key.trim() === "POSTMAN_API_KEY") config.postmanApiKey = value;
          if (key.trim() === "POSTMAN_COLLECTION_ID") config.postmanCollectionId = value;
        }
      });
    }
  } catch (error) {
    // Ignore env loading errors
  }

  // 2. Try to load from package.json
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const userConfig = packageJson.moduleGenerator || {};

      if (userConfig.modulesDir) config.modulesDir = userConfig.modulesDir;
      if (userConfig.routesFile) config.routesFile = userConfig.routesFile;
      if (userConfig.postmanApiKey) config.postmanApiKey = userConfig.postmanApiKey;
      if (userConfig.postmanCollectionId) config.postmanCollectionId = userConfig.postmanCollectionId;
    }
  } catch (error) {
    console.warn(
      "Could not load configuration from package.json, using defaults"
    );
  }
  return config;
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
  // Collect enum imports
  const enumImports = fields
    .filter(f => f.type === 'enum' && f.enumValues?.length)
    .map(f => `${toCamelCase(f.name)}Enum`);

  let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model`;

  if (enumImports.length > 0) {
    modelContent += `, ${enumImports.join(', ')}`;
  }

  modelContent += ` } from './${folderName}.interface'; \n\n`;

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
      // Check for nested objects within this schema - GENERATE CHILDREN FIRST
      const nestedSchemas = generateNestedSchemas(field.objectProperties);
      schemas += nestedSchemas;

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
        const enumName = `${toCamelCase(field.name)}Enum`;
        return `{ type: String, enum: Object.values(${enumName}) }`;
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
            return `{ type: [Schema.Types.ObjectId], ref: '${field.ref || "Document"
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
  const folderName = camelCaseName.toLowerCase();
  let validationContent = `import { z } from 'zod';\n`;

  // Collect enum imports
  const enumImports = fields
    .filter(f => f.type === 'enum' && f.enumValues?.length)
    .map(f => `${toCamelCase(f.name)}Enum`);

  if (enumImports.length > 0) {
    validationContent += `import { ${enumImports.join(', ')} } from './${folderName}.interface';\n`;
  }

  validationContent += `\n`;

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
        const enumName = `${toCamelCase(field.name)}Enum`;
        return `z.nativeEnum(${enumName})`;
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



// Route generation is now handled by the imported template

// Enhanced createModule function with documentation generation
function createModule(
  name: string,
  fields: FieldDefinition[],
  skipFiles: string[],
  config: ModuleGeneratorConfig,
  docOptions: DocumentationOptions = {},
  hasFile: boolean = false
): void {
  const camelCaseName = toCamelCase(name);
  const folderName = camelCaseName.toLowerCase();
  const folderPath = path.join(process.cwd(), config.modulesDir, folderName);

  // Check if file removal helper is needed
  if (hasFile) {
    // Generate the helper file in src/helpers
    generateFileHelper();
  }

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
    service: generateServiceContent(camelCaseName, folderName, fields, hasFile),
    route: generateRouteContent(camelCaseName, folderName, fields),
    validation: generateValidationContent(camelCaseName, fields),
    constants: generateConstantsContent(camelCaseName, folderName, fields),
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
      .version("1.4.1");

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
      .option("--postman-api-key <string>", "Postman API Key")
      .option("--postman-collection-id <string>", "Postman Collection ID")
      .allowUnknownOption(true)
      .action((name: string, options: any) => {
        // Override config with CLI options
        if (options.modulesDir) {
          config.modulesDir = options.modulesDir;
        }
        if (options.routesFile) {
          config.routesFile = options.routesFile;
        }
        if (options.postmanApiKey) {
          config.postmanApiKey = options.postmanApiKey;
        }
        if (options.postmanCollectionId) {
          config.postmanCollectionId = options.postmanCollectionId;
        }

        // Get field definitions from remaining arguments
        const fieldArgs = program.args.slice(2); // Skip 'generate' and module name
        console.log("Processing field arguments:", fieldArgs);

        const { fields, skipFiles, hasFile } = parseFieldDefinitions(fieldArgs);

        if (fields.length === 0) {
          console.log("⚠️  No fields were parsed. Check your command syntax.");
          console.log("Example: leo-generate generate User name:string email:string age:number");
          return;
        }

        createModule(name, fields, skipFiles, config, {
          updatePostman: options.postman !== false,
          updateSwagger: options.swagger !== false,
          postmanDir: options.postmanDir,
          swaggerFile: options.swaggerFile,
          postmanApiKey: config.postmanApiKey,
          postmanCollectionId: config.postmanCollectionId
        }, hasFile);
      });

    program
      .command("update-docs")
      .alias("docs")
      .description("Update Postman and Swagger documentation for existing modules")
      .argument("[modules...]", "Specific modules to update (optional)")
      .option("--modules-dir <path>", "Path to modules directory", "src/app/modules")
      .option("--no-postman", "Skip Postman collection generation")
      .option("--no-swagger", "Skip Swagger documentation generation")
      .option("--postman-dir <path>", "Custom Postman output directory", "postman")
      .option("--swagger-file <path>", "Custom Swagger file path", "swagger.json")
      .action(async (modules: string[], options: any) => {
        await updateExistingModulesDocumentation(options.modulesDir, {
          updatePostman: options.postman !== false,
          updateSwagger: options.swagger !== false,
          postmanDir: options.postmanDir,
          swaggerFile: options.swaggerFile,
          postmanApiKey: config.postmanApiKey,
          postmanCollectionId: config.postmanCollectionId
        }, modules);
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

          const { fields, skipFiles, hasFile } = parseFieldDefinitions(fieldArgs);

          if (fields.length === 0) {
            console.log("⚠️  No fields were parsed. Check your command syntax.");
            console.log("Example: leo-generate User name:string email:string age:number");
            return;
          }

          createModule(name, fields, skipFiles, config, {
            updatePostman: true,
            updateSwagger: true,
            postmanDir: "postman",
            swaggerFile: "swagger.json",
            postmanApiKey: config.postmanApiKey,
            postmanCollectionId: config.postmanCollectionId
          }, hasFile);
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