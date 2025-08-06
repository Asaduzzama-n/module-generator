import { FieldDefinition } from "../types";
import { generatePostmanCollection, savePostmanCollection } from "./postmanGenerator";
import { updateSwaggerFile } from "./swaggerGenerator";
import * as fs from "fs";
import * as path from "path";

export interface DocumentationOptions {
  postmanDir?: string;
  swaggerFile?: string;
  updatePostman?: boolean;
  updateSwagger?: boolean;
}

export function updateAllDocumentation(
  moduleName: string,
  fields: FieldDefinition[],
  options: DocumentationOptions = {}
): void {
  const {
    postmanDir = "postman",
    swaggerFile = "swagger.json",
    updatePostman = true,
    updateSwagger = true
  } = options;

  console.log(`📚 Updating documentation for ${moduleName}...`);

  if (updatePostman) {
    try {
      const postmanCollection = generatePostmanCollection(moduleName, fields);
      savePostmanCollection(moduleName, postmanCollection, postmanDir);
    } catch (error) {
      console.error("❌ Error updating Postman collection:", error);
    }
  }

  if (updateSwagger) {
    try {
      updateSwaggerFile(moduleName, fields, swaggerFile);
    } catch (error) {
      console.error("❌ Error updating Swagger documentation:", error);
    }
  }

  console.log("✅ Documentation update completed!");
}

export function updateExistingModulesDocumentation(
  modulesDir: string = "src/app/modules",
  options: DocumentationOptions = {}
): void {
  const fullModulesPath = path.join(process.cwd(), modulesDir);
  
  if (!fs.existsSync(fullModulesPath)) {
    console.error(`❌ Modules directory not found: ${fullModulesPath}`);
    return;
  }

  console.log("🔄 Scanning existing modules for documentation updates...");

  const moduleDirectories = fs.readdirSync(fullModulesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let updatedCount = 0;

  for (const moduleDir of moduleDirectories) {
    try {
      const modulePath = path.join(fullModulesPath, moduleDir);
      const interfaceFile = path.join(modulePath, `${moduleDir}.interface.ts`);
      
      if (fs.existsSync(interfaceFile)) {
        console.log(`📝 Processing module: ${moduleDir}`);
        
        // Extract fields from interface file (basic parsing)
        const fields = extractFieldsFromInterface(interfaceFile);
        
        if (fields.length > 0) {
          const camelCaseName = toCamelCase(moduleDir);
          updateAllDocumentation(camelCaseName, fields, options);
          updatedCount++;
        } else {
          console.warn(`⚠️  No fields found in ${moduleDir} interface`);
        }
      } else {
        console.warn(`⚠️  Interface file not found for module: ${moduleDir}`);
      }
    } catch (error) {
      console.error(`❌ Error processing module ${moduleDir}:`, error);
    }
  }

  console.log(`✅ Updated documentation for ${updatedCount} modules`);
}

// Basic field extraction from interface file (simplified parsing)
function extractFieldsFromInterface(interfaceFilePath: string): FieldDefinition[] {
  try {
    const content = fs.readFileSync(interfaceFilePath, "utf-8");
    const fields: FieldDefinition[] = [];
    
    // Find the main interface definition
    const interfaceMatch = content.match(/export interface I\w+\s*{([^}]+)}/);
    if (!interfaceMatch) return fields;
    
    const interfaceBody = interfaceMatch[1];
    const lines = interfaceBody.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('_id')) {
        continue;
      }
      
      // Basic field parsing: fieldName?: Type;
      const fieldMatch = trimmedLine.match(/(\w+)(\?)?:\s*([^;]+);?/);
      if (fieldMatch) {
        const [, name, optional, typeStr] = fieldMatch;
        const isOptional = !!optional;
        
        // Map TypeScript types back to our field types (simplified)
        let type = "string";
        if (typeStr.includes("number")) type = "number";
        else if (typeStr.includes("boolean")) type = "boolean";
        else if (typeStr.includes("Date")) type = "date";
        else if (typeStr.includes("[]")) type = "array";
        else if (typeStr.includes("ObjectId")) type = "objectid";
        
        fields.push({
          name,
          type,
          isOptional,
          isRequired: !isOptional
        });
      }
    }
    
    return fields;
  } catch (error) {
    console.error("Error extracting fields from interface:", error);
    return [];
  }
}

function toCamelCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}