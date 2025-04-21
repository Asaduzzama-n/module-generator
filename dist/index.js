#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
// Default configuration
const defaultConfig = {
    modulesDir: "src/app/modules",
    routesFile: "src/routes/index.ts",
};
// Load configuration from package.json or use defaults
function loadConfig() {
    try {
        const packageJsonPath = path_1.default.join(process.cwd(), "package.json");
        if (fs_1.default.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf-8"));
            const config = packageJson.moduleGenerator || {};
            return {
                modulesDir: config.modulesDir || defaultConfig.modulesDir,
                routesFile: config.routesFile || defaultConfig.routesFile,
            };
        }
    }
    catch (error) {
        console.warn("Could not load configuration from package.json, using defaults");
    }
    return defaultConfig;
}
function toCamelCase(str) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => index === 0 ? match.toUpperCase() : match.toLowerCase())
        .replace(/\s+/g, "");
}
function parseFieldDefinitions(args) {
    const fields = [];
    const skipFiles = [];
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
        }
        else {
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
                    if (type === "array" &&
                        parts.length > 2 &&
                        parts[2].toLowerCase() === "object") {
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
                        console.log(`Added field with ${objectProperties.length} properties`);
                    }
                    else {
                        // Regular field
                        const ref = parts.length > 2 ? parts[2].trim() : undefined;
                        fields.push({ name, type, ref, isRequired, isOptional });
                        console.log(`Added regular field: ${name}:${type}${ref ? `:${ref}` : ""}`);
                    }
                }
            }
            catch (error) {
                console.error(`Error parsing field definition: ${arg}`, error);
            }
        }
    }
    console.log("Parsed fields:", JSON.stringify(fields, null, 2));
    return { fields, skipFiles };
}
// Update the generateInterfaceContent function to properly handle object properties
function generateInterfaceContent(camelCaseName, fields) {
    let interfaceContent = `import { Model, Types } from 'mongoose';\n\n`;
    // Add nested interfaces for array of objects
    fields.forEach((field) => {
        var _a, _b;
        if (field.type.toLowerCase() === "array" &&
            ((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
            ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
            const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
            interfaceContent += `export interface ${nestedInterfaceName} {\n`;
            // Add properties from the objectProperties array
            field.objectProperties.forEach((prop) => {
                let tsType = "string"; // Default type
                // Map common MongoDB types to TypeScript types
                switch (prop.type.toLowerCase()) {
                    case "string":
                        tsType = "string";
                        break;
                    case "number":
                        tsType = "number";
                        break;
                    case "boolean":
                        tsType = "boolean";
                        break;
                    case "date":
                        tsType = "Date";
                        break;
                    case "array":
                        tsType = "any[]";
                        break;
                    case "object":
                        tsType = "Record<string, any>";
                        break;
                    case "objectid":
                    case "id":
                        tsType = "Types.ObjectId";
                        break;
                    default:
                        tsType = "any";
                }
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
    }
    else {
        interfaceContent += "  // Define the interface for ${camelCaseName} here\n";
    }
    interfaceContent += `};\n\nexport type ${camelCaseName}Model = Model<I${camelCaseName}>;\n`;
    return interfaceContent;
}
// Helper function to map types to TypeScript types
function mapToTypeScriptType(type, field) {
    var _a;
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
            if (field === null || field === void 0 ? void 0 : field.ref) {
                if (field.ref.toLowerCase() === "object" &&
                    ((_a = field.objectProperties) === null || _a === void 0 ? void 0 : _a.length)) {
                    // Array of objects with defined structure
                    const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
                    return `${nestedInterfaceName}[]`;
                }
                else {
                    // Array of references to other models
                    return `Types.ObjectId[]`;
                }
            }
            else {
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
function generateModelContent(camelCaseName, folderName, fields) {
    let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface'; \n\n`;
    // Add nested schemas for array of objects
    fields.forEach((field) => {
        var _a, _b;
        if (field.type.toLowerCase() === "array" &&
            ((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
            ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
            const nestedSchemaName = `${field.name}ItemSchema`;
            modelContent += `const ${nestedSchemaName} = new Schema({\n`;
            // Add properties from the objectProperties array
            field.objectProperties.forEach((prop) => {
                let schemaType = "String"; // Default type
                let additionalProps = "";
                // Map to Mongoose schema types
                switch (prop.type.toLowerCase()) {
                    case "string":
                        schemaType = "String";
                        break;
                    case "number":
                        schemaType = "Number";
                        break;
                    case "boolean":
                        schemaType = "Boolean";
                        break;
                    case "date":
                        schemaType = "Date";
                        break;
                    case "array":
                        schemaType = "[Schema.Types.Mixed]";
                        break;
                    case "object":
                        schemaType = "Schema.Types.Mixed";
                        break;
                    case "objectid":
                    case "id":
                        schemaType = "Schema.Types.ObjectId";
                        break;
                    default:
                        schemaType = "String";
                }
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
    }
    else {
        modelContent += "  // Define schema fields here\n";
    }
    modelContent += `}, {\n  timestamps: true\n});\n\nexport const ${camelCaseName} = model<I${camelCaseName}, ${camelCaseName}Model>('${camelCaseName}', ${folderName}Schema);\n`;
    return modelContent;
}
// Helper function to map types to Mongoose schema types
function mapToMongooseType(type, field) {
    var _a;
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
            if (field === null || field === void 0 ? void 0 : field.ref) {
                if (field.ref.toLowerCase() === "object" &&
                    ((_a = field.objectProperties) === null || _a === void 0 ? void 0 : _a.length)) {
                    // Array of objects with defined structure
                    const nestedSchemaName = `${field.name}ItemSchema`;
                    return `[${nestedSchemaName}]`;
                }
                else {
                    // Array of references to other models
                    return "[Schema.Types.ObjectId]";
                }
            }
            else {
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
function generateValidationContent(camelCaseName, fields) {
    let validationContent = `import { z } from 'zod';\n\n`;
    // Add nested schemas for array of objects
    fields.forEach((field) => {
        var _a, _b;
        if (field.type.toLowerCase() === "array" &&
            ((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
            ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
            const nestedSchemaName = `${field.name}ItemSchema`;
            validationContent += `const ${nestedSchemaName} = z.object({\n`;
            // Add properties from the objectProperties array
            field.objectProperties.forEach((prop) => {
                let zodType = mapToZodType(prop.type);
                // Add required/optional modifiers
                if (prop.isRequired) {
                    // Already required by default in Zod
                }
                else if (prop.isOptional) {
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
            }
            else if (field.isOptional) {
                zodType += ".optional()";
            }
            validationContent += `    ${field.name}: ${zodType},\n`;
        });
    }
    else {
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
    }
    else {
        validationContent += `    // Add validation fields\n`;
    }
    validationContent += `  }),\n};\n`;
    return validationContent;
}
// Helper function to map types to Zod validators
function mapToZodType(type, field) {
    var _a;
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
            if (field === null || field === void 0 ? void 0 : field.ref) {
                if (field.ref.toLowerCase() === "object" &&
                    ((_a = field.objectProperties) === null || _a === void 0 ? void 0 : _a.length)) {
                    // Array of objects with defined structure
                    const nestedSchemaName = `${field.name}ItemSchema`;
                    return `z.array(${nestedSchemaName})`;
                }
                else {
                    // Array of references to other models
                    return "z.array(z.string())";
                }
            }
            else {
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
        const program = new commander_1.Command();
        program
            .name("create-module")
            .description("Generate Express module files with Mongoose models")
            .version("1.0.8")
            .argument("<name>", "Module name")
            .option("-c, --config <path>", "Path to custom config file")
            .option("--modules-dir <path>", "Path to modules directory")
            .option("--routes-file <path>", "Path to routes file")
            .allowUnknownOption(true) // Allow field definitions to be passed
            .action((name, options) => {
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
    }
    catch (error) {
        console.error("Error executing command:", error);
        process.exit(1);
    }
}
// Make sure the createModule function is properly implemented
function createModule(name, fields, skipFiles, config) {
    const camelCaseName = toCamelCase(name);
    const folderName = camelCaseName.toLowerCase();
    const folderPath = path_1.default.join(process.cwd(), config.modulesDir, folderName);
    // Check if the folder already exists
    if (!fs_1.default.existsSync(folderPath)) {
        fs_1.default.mkdirSync(folderPath, { recursive: true });
        console.log(`Created folder: ${folderName}`);
    }
    else {
        console.log(`Folder ${folderName} already exists.`);
        return;
    }
    const templates = {
        interface: generateInterfaceContent(camelCaseName, fields),
        model: generateModelContent(camelCaseName, folderName, fields),
        controller: `import { Request, Response, NextFunction } from 'express';\nimport { ${camelCaseName}Services } from './${folderName}.service';\n\nexport const ${camelCaseName}Controller = { };\n`,
        service: `import { ${camelCaseName}Model } from './${folderName}.interface';\n\nexport const ${camelCaseName}Services = { };\n`,
        route: `import express from 'express';\nimport { ${camelCaseName}Controller } from './${folderName}.controller';\n\nconst router = express.Router();\n \n\nexport const ${camelCaseName}Routes = router;\n`,
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
        const filePath = path_1.default.join(folderPath, `${folderName}.${key}.ts`);
        fs_1.default.writeFileSync(filePath, content);
        console.log(`Created file: ${filePath}`);
    });
    // Add the new module to the central router file
    updateRouterFile(folderName, camelCaseName, config);
}
// Make sure the updateRouterFile function is properly implemented
function updateRouterFile(folderName, camelCaseName, config) {
    const routerFilePath = path_1.default.join(process.cwd(), config.routesFile);
    // Check if the router file exists
    if (!fs_1.default.existsSync(routerFilePath)) {
        console.warn(`Router file not found: ${routerFilePath}`);
        return;
    }
    try {
        let routerContent = fs_1.default.readFileSync(routerFilePath, "utf-8");
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
            }
            else {
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
                const equalsSignIndex = routerContent.indexOf("=", apiRoutesDeclaration);
                if (equalsSignIndex !== -1) {
                    // Find the opening bracket of the array initialization
                    const arrayStartIndex = routerContent.indexOf("[", equalsSignIndex);
                    // Find the closing bracket of the array
                    const arrayEndIndex = routerContent.indexOf("]", arrayStartIndex);
                    if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
                        // Check if there are existing routes
                        const arrayContent = routerContent.substring(arrayStartIndex, arrayEndIndex);
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
            }
            else {
                console.warn("Could not find apiRoutes array in router file");
            }
        }
        // Write the updated content back to the file
        fs_1.default.writeFileSync(routerFilePath, routerContent);
        console.log(`Updated router file: ${routerFilePath}`);
    }
    catch (error) {
        console.error(`Error updating router file: ${error}`);
    }
}
// Call the main function to start the CLI
main();
