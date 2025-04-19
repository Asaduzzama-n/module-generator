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
    args.forEach((arg) => {
        // Split by colon to get name, type, and optional reference
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
            fields.push({ name, type, ref, isRequired, isOptional });
        }
    });
    return fields;
}
function generateInterfaceContent(camelCaseName, fields) {
    let interfaceContent = `import { Model, Types } from 'mongoose';\n\nexport type I${camelCaseName} = {\n`;
    // Add fields to interface
    if (fields.length > 0) {
        fields.forEach((field) => {
            let tsType = "string"; // Default type
            // Map common MongoDB types to TypeScript types
            switch (field.type.toLowerCase()) {
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
                    // If it's an array with a reference, use ObjectId[]
                    tsType = field.ref ? `Types.ObjectId[]` : "any[]";
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
function generateModelContent(camelCaseName, folderName, fields) {
    let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface'; \n\nconst ${folderName}Schema = new Schema<I${camelCaseName}, ${camelCaseName}Model>({\n`;
    // Add fields to schema
    if (fields.length > 0) {
        fields.forEach((field) => {
            let schemaType = "String"; // Default type
            let additionalProps = "";
            // Map to Mongoose schema types
            switch (field.type.toLowerCase()) {
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
                    if (field.ref) {
                        // Array of references
                        schemaType = "[Schema.Types.ObjectId]";
                        additionalProps = `, ref: '${field.ref}'`;
                    }
                    else {
                        schemaType = "[Schema.Types.Mixed]";
                    }
                    break;
                case "object":
                    schemaType = "Schema.Types.Mixed";
                    break;
                case "objectid":
                case "id":
                    schemaType = "Schema.Types.ObjectId";
                    additionalProps = field.ref ? `, ref: '${field.ref}'` : "";
                    break;
                default:
                    schemaType = "String";
            }
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
function createModule(name, fields, config) {
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
        validation: `import { z } from 'zod';\n\nexport const ${camelCaseName}Validations = {  };\n`,
        constants: `export const ${camelCaseName.toUpperCase()}_CONSTANT = 'someValue';\n`,
    };
    Object.entries(templates).forEach(([key, content]) => {
        const filePath = path_1.default.join(folderPath, `${folderName}.${key}.ts`);
        fs_1.default.writeFileSync(filePath, content);
        console.log(`Created file: ${filePath}`);
    });
    // Add the new module to the central `apiRoutes` array
    updateRouterFile(folderName, camelCaseName, config);
}
function updateRouterFile(folderName, camelCaseName, config) {
    const routerPath = path_1.default.join(process.cwd(), config.routesFile);
    // Check if router file exists
    if (!fs_1.default.existsSync(routerPath)) {
        console.warn(`Router file not found at ${routerPath}. Skipping route registration.`);
        return;
    }
    const routeImport = `import { ${camelCaseName}Routes } from '../app/modules/${folderName}/${folderName}.route';`;
    const routeEntry = `  { path: '/${folderName}', route: ${camelCaseName}Routes }`;
    try {
        let routerFileContent = fs_1.default.readFileSync(routerPath, "utf-8");
        // Check if the import statement is already present
        if (!routerFileContent.includes(routeImport)) {
            // Find the last import statement
            const lastImportIndex = routerFileContent.lastIndexOf("import");
            const endOfImports = routerFileContent.indexOf("\n", lastImportIndex);
            // Insert new import after the last import
            const beforeImports = routerFileContent.substring(0, endOfImports + 1);
            const afterImports = routerFileContent.substring(endOfImports + 1);
            routerFileContent = `${beforeImports}${routeImport}\n${afterImports}`;
        }
        // Find the apiRoutes array
        // Improved regex to match the array declaration and opening bracket
        const apiRoutesRegex = /const\s+apiRoutes\s*:\s*{[^}]*}\[\]\s*=\s*\[/;
        const match = routerFileContent.match(apiRoutesRegex);
        if (match) {
            const apiRoutesStart = match.index + match[0].length;
            const apiRoutesEndIndex = findClosingBracketIndex(routerFileContent, apiRoutesStart);
            // Check if route entry already exists
            if (!routerFileContent.includes(`path: '/${folderName}'`)) {
                // Get the content inside the array
                const arrayContent = routerFileContent
                    .substring(apiRoutesStart, apiRoutesEndIndex)
                    .trim();
                // Add the new route entry
                const newArrayContent = arrayContent
                    ? `${arrayContent},\n${routeEntry}`
                    : routeEntry;
                // Replace the array content
                routerFileContent =
                    routerFileContent.substring(0, apiRoutesStart) +
                        "\n" +
                        newArrayContent +
                        "\n" +
                        routerFileContent.substring(apiRoutesEndIndex);
            }
            // Write the updated content back to the file
            fs_1.default.writeFileSync(routerPath, routerFileContent, "utf-8");
            console.log(`✅ Added route for ${camelCaseName} to central router.`);
        }
        else {
            // Fallback approach if the regex doesn't match
            console.log("Using fallback approach to update router file...");
            // Look for the array closing and the forEach
            const arrayEndRegex = /\]\s*\n\s*apiRoutes\.forEach/;
            const endMatch = routerFileContent.match(arrayEndRegex);
            if (endMatch) {
                const insertPosition = endMatch.index;
                // Check if route entry already exists
                if (!routerFileContent.includes(`path: '/${folderName}'`)) {
                    // Insert the new route before the array closing bracket
                    const beforeInsert = routerFileContent.substring(0, insertPosition);
                    const afterInsert = routerFileContent.substring(insertPosition);
                    routerFileContent = `${beforeInsert.trimEnd()},\n${routeEntry}\n${afterInsert}`;
                    // Write the updated content back to the file
                    fs_1.default.writeFileSync(routerPath, routerFileContent, "utf-8");
                    console.log(`✅ Added route for ${camelCaseName} to central router using fallback method.`);
                }
            }
            else {
                console.error("Failed to find apiRoutes array in the router file.");
            }
        }
    }
    catch (error) {
        console.error("Error updating router file:", error);
    }
}
// Helper function to find the index of the closing bracket
function findClosingBracketIndex(text, startIndex) {
    let bracketCount = 1;
    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === "[") {
            bracketCount++;
        }
        else if (text[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
                return i;
            }
        }
    }
    return -1;
}
// Main CLI function
function main() {
    try {
        const config = loadConfig();
        const program = new commander_1.Command();
        program
            .name("create-module")
            .description("Generate Express module files with Mongoose models")
            .version("1.0.3")
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
            const fields = parseFieldDefinitions(fieldArgs);
            createModule(name, fields, config);
        });
        program.parse();
    }
    catch (error) {
        console.error("Error executing command:", error);
        process.exit(1);
    }
}
// Execute the CLI
main();
