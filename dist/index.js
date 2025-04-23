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
    }
    else {
        interfaceContent += "  // Define the interface for ${camelCaseName} here\n";
    }
    interfaceContent += `};\n\nexport type ${camelCaseName}Model = Model<I${camelCaseName}>;\n`;
    return interfaceContent;
}
// Helper function to generate nested interfaces
function generateNestedInterfaces(fields) {
    let interfaces = "";
    fields.forEach((field) => {
        var _a, _b;
        if (field.type.toLowerCase() === "array" &&
            ((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
            ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
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
function mapToTypeScriptType(field) {
    var _a, _b, _c;
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
            if (((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
                ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
                // Array of objects with defined structure
                const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
                return `${nestedInterfaceName}[]`;
            }
            else if (field.arrayItemType) {
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
                        return "any[]";
                }
            }
            else {
                return "any[]";
            }
        case "object":
            if ((_c = field.objectProperties) === null || _c === void 0 ? void 0 : _c.length) {
                // Object with defined properties
                return `{ ${field.objectProperties
                    .map((prop) => {
                    const optionalMarker = prop.isOptional ? "?" : "";
                    return `${prop.name}${optionalMarker}: ${mapToTypeScriptType(prop)}`;
                })
                    .join("; ")} }`;
            }
            else {
                return "Record<string, any>";
            }
        case "objectid":
        case "id":
            return "Types.ObjectId";
        default:
            return "any";
    }
}
// Update the model generation to handle complex nested structures
function generateModelContent(camelCaseName, folderName, fields) {
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
    }
    else {
        modelContent += "  // Define schema fields here\n";
    }
    modelContent += `}, {\n  timestamps: true\n});\n\nexport const ${camelCaseName} = model<I${camelCaseName}, ${camelCaseName}Model>('${camelCaseName}', ${folderName}Schema);\n`;
    return modelContent;
}
// Helper function to generate nested schemas
function generateNestedSchemas(fields) {
    let schemas = "";
    fields.forEach((field) => {
        var _a, _b;
        if (field.type.toLowerCase() === "array" &&
            ((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
            ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
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
function mapToMongooseType(field) {
    var _a, _b, _c;
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
            if (((_a = field.ref) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "object" &&
                ((_b = field.objectProperties) === null || _b === void 0 ? void 0 : _b.length)) {
                // Array of objects with defined structure
                const nestedSchemaName = `${field.name}ItemSchema`;
                return `[${nestedSchemaName}]`;
            }
            else if (field.arrayItemType) {
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
                        return `{ type: [Schema.Types.ObjectId], ref: '${field.ref || "Document"}' }`;
                    default:
                        return "{ type: [Schema.Types.Mixed] }";
                }
            }
            else {
                return "{ type: [Schema.Types.Mixed] }";
            }
        case "object":
            if ((_c = field.objectProperties) === null || _c === void 0 ? void 0 : _c.length) {
                // Object with defined properties
                return `{ ${field.objectProperties
                    .map((prop) => {
                    return `${prop.name}: ${mapToMongooseType(prop)}`;
                })
                    .join(", ")} }`;
            }
            else {
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
        service: `import { I${camelCaseName} } from './${folderName}.interface';\n\nimport { ${camelCaseName} } from './${folderName}.model';\n\nexport const ${camelCaseName}Services = { };\n`,
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
