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
      const modelFile = path.join(modulePath, `${moduleDir}.model.ts`);
      
      if (fs.existsSync(interfaceFile)) {
        console.log(`📝 Processing module: ${moduleDir}`);
        
        // Check if model file exists for better parsing
        if (fs.existsSync(modelFile)) {
          console.log(`   📄 Found interface and model files`);
        } else {
          console.log(`   📄 Found interface file (model file missing)`);
        }
        
        // Extract fields from interface and model files
        const fields = extractFieldsFromInterface(interfaceFile);
        
        if (fields.length > 0) {
          console.log(`   🔍 Extracted ${fields.length} fields: ${fields.map(f => f.name).join(', ')}`);
          
          const camelCaseName = toCamelCase(moduleDir);
          updateAllDocumentation(camelCaseName, fields, options);
          updatedCount++;
        } else {
          console.warn(`   ⚠️  No fields found in ${moduleDir} interface`);
        }
      } else {
        console.warn(`⚠️  Interface file not found for module: ${moduleDir}`);
      }
    } catch (error) {
      console.error(`❌ Error processing module ${moduleDir}:`, error);
      console.error(`   Details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`✅ Updated documentation for ${updatedCount} modules`);
}

// Enhanced field extraction from both interface and model files
function extractFieldsFromInterface(interfaceFilePath: string): FieldDefinition[] {
  try {
    const moduleDir = path.dirname(interfaceFilePath);
    const moduleName = path.basename(interfaceFilePath, '.interface.ts');
    const modelFilePath = path.join(moduleDir, `${moduleName}.model.ts`);
    
    // Read both interface and model files
    const interfaceContent = fs.readFileSync(interfaceFilePath, "utf-8");
    let modelContent = "";
    if (fs.existsSync(modelFilePath)) {
      modelContent = fs.readFileSync(modelFilePath, "utf-8");
    }
    
    const fields: FieldDefinition[] = [];
    
    // Extract nested interface definitions first
    const nestedInterfaces = extractNestedInterfaces(interfaceContent);
    
    // Find the main interface definition (starts with 'I' and is the main entity interface)
    // Use a more robust approach to find the correct interface
    let mainInterfaceBody = "";
    
    // Split content by interface definitions and find the main one
    const interfaceRegex = /export interface (I\w+)\s*\{([\s\S]*?)\}/g;
    let match;
    
    while ((match = interfaceRegex.exec(interfaceContent)) !== null) {
      const [, interfaceName, body] = match;
      // The main interface usually has _id field and more content
      if (body.includes('_id') && body.includes('Types.ObjectId')) {
        mainInterfaceBody = body;
        break;
      }
    }
    
    if (!mainInterfaceBody) {
      // Fallback: find any interface starting with 'I'
      const fallbackMatch = interfaceContent.match(/export interface I\w+\s*\{([\s\S]*?)\}/);
      if (fallbackMatch) {
        mainInterfaceBody = fallbackMatch[1];
      } else {
        return fields;
      }
    }
    
    const lines = mainInterfaceBody.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('_id') || trimmedLine.includes('createdAt') || trimmedLine.includes('updatedAt')) {
        continue;
      }
      
      // Enhanced field parsing: fieldName?: Type;
      const fieldMatch = trimmedLine.match(/(\w+)(\?)?:\s*([^;]+);?/);
      if (fieldMatch) {
        const [, name, optional, typeStr] = fieldMatch;
        const isOptional = !!optional;
        
        // Get additional info from model file
        const modelFieldInfo = extractFieldInfoFromModel(name, modelContent);
        
        // Enhanced type mapping
        const fieldDef = mapTypeScriptTypeToFieldDefinition(name, typeStr, isOptional, modelFieldInfo, nestedInterfaces);
        
        if (fieldDef) {
          fields.push(fieldDef);
        }
      }
    }
    
    return fields;
  } catch (error) {
    console.error("Error extracting fields from interface:", error);
    return [];
  }
}

// Extract nested interface definitions
function extractNestedInterfaces(content: string): Map<string, FieldDefinition[]> {
  const nestedInterfaces = new Map<string, FieldDefinition[]>();
  
  // Find all interface definitions using a more robust approach
  const interfaceRegex = /export interface (\w+)\s*\{([\s\S]*?)\}/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const [, interfaceName, interfaceBody] = match;
    
    // Skip the main interface (starts with 'I' and has more than 1 character after 'I')
    if (interfaceName.startsWith('I') && interfaceName.length > 1 && interfaceName !== 'ItemsItem') {
      continue;
    }
    
    // Skip type definitions
    if (interfaceName.includes('Model') || interfaceName.includes('Type')) {
      continue;
    }
    
    const fields: FieldDefinition[] = [];
    const lines = interfaceBody.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//')) continue;
      
      const fieldMatch = trimmedLine.match(/(\w+)(\?)?:\s*([^;]+);?/);
      if (fieldMatch) {
        const [, name, optional, typeStr] = fieldMatch;
        const isOptional = !!optional;
        
        fields.push({
          name,
          type: mapSimpleType(typeStr),
          isOptional,
          isRequired: !isOptional
        });
      }
    }
    
    if (fields.length > 0) {
      nestedInterfaces.set(interfaceName, fields);
    }
  }
  
  return nestedInterfaces;
}

// Extract field information from model file
function extractFieldInfoFromModel(fieldName: string, modelContent: string): any {
  if (!modelContent) return null;
  
  try {
    // Look for field definition in schema - handle multiline definitions
    const fieldRegex = new RegExp(`${fieldName}:\\s*\\{([^}]+)\\}`, 'i');
    const match = modelContent.match(fieldRegex);
    
    if (match) {
      const fieldDef = match[1].trim();
      
      // Extract enum values if present
      const enumMatch = fieldDef.match(/enum:\s*\[([^\]]+)\]/);
      if (enumMatch) {
        const enumValues = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
        return { enumValues, isEnum: true };
      }
      
      // Extract reference information
      const refMatch = fieldDef.match(/ref:\s*['"]([^'"]+)['"]/);
      if (refMatch) {
        return { ref: refMatch[1], isReference: true };
      }
      
      // Check if it's an array
      if (fieldDef.includes('[') && fieldDef.includes(']')) {
        return { isArray: true };
      }
    }
    
    // Fallback: look for simpler field definitions
    const simpleFieldRegex = new RegExp(`${fieldName}:\\s*([^,}]+)`, 'i');
    const simpleMatch = modelContent.match(simpleFieldRegex);
    
    if (simpleMatch) {
      const fieldDef = simpleMatch[1].trim();
      
      // Extract enum values from simple definitions
      const enumMatch = fieldDef.match(/enum:\s*\[([^\]]+)\]/);
      if (enumMatch) {
        const enumValues = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
        return { enumValues, isEnum: true };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Enhanced type mapping function
function mapTypeScriptTypeToFieldDefinition(
  name: string, 
  typeStr: string, 
  isOptional: boolean, 
  modelInfo: any, 
  nestedInterfaces: Map<string, FieldDefinition[]>
): FieldDefinition | null {
  
  // Handle enum types from model or interface
  if (modelInfo?.isEnum && modelInfo.enumValues) {
    return {
      name,
      type: "enum",
      enumValues: modelInfo.enumValues,
      isOptional,
      isRequired: !isOptional
    };
  }
  
  // Check if it's a union type enum in the interface (e.g., 'active' | 'inactive')
  if (typeStr.includes('|')) {
    const enumValues = typeStr.split('|').map(v => v.trim().replace(/['"]/g, ''));
    return {
      name,
      type: "enum",
      enumValues,
      isOptional,
      isRequired: !isOptional
    };
  }
  
  // Handle ObjectId references
  if (typeStr.includes("Types.ObjectId") || typeStr.includes("ObjectId")) {
    if (typeStr.includes("[]")) {
      // Array of ObjectIds
      return {
        name,
        type: "array",
        arrayItemType: "objectid",
        ref: modelInfo?.ref || "Document",
        isOptional,
        isRequired: !isOptional
      };
    } else {
      // Single ObjectId
      return {
        name,
        type: "objectid",
        ref: modelInfo?.ref || "Document",
        isOptional,
        isRequired: !isOptional
      };
    }
  }
  
  // Handle arrays
  if (typeStr.includes("[]")) {
    const baseType = typeStr.replace("[]", "").trim();
    
    // Check if it's an array of nested interface objects
    if (nestedInterfaces.has(baseType)) {
      const objectProperties = nestedInterfaces.get(baseType) || [];
      return {
        name,
        type: "array",
        ref: "object",
        objectProperties,
        isOptional,
        isRequired: !isOptional
      };
    }
    
    // Handle basic array types with proper arrayItemType
    const arrayItemType = mapSimpleType(baseType);
    return {
      name,
      type: "array",
      arrayItemType,
      isOptional,
      isRequired: !isOptional
    };
  }
  
  // Handle nested objects
  if (nestedInterfaces.has(typeStr)) {
    const objectProperties = nestedInterfaces.get(typeStr) || [];
    return {
      name,
      type: "object",
      objectProperties,
      isOptional,
      isRequired: !isOptional
    };
  }
  
  // Handle basic types
  return {
    name,
    type: mapSimpleType(typeStr),
    isOptional,
    isRequired: !isOptional
  };
}

// Simple type mapping helper
function mapSimpleType(typeStr: string): string {
  const cleanType = typeStr.toLowerCase().trim();
  
  if (cleanType.includes("string")) return "string";
  if (cleanType.includes("number")) return "number";
  if (cleanType.includes("boolean")) return "boolean";
  if (cleanType.includes("date")) return "date";
  if (cleanType.includes("objectid")) return "objectid";
  
  return "string"; // Default fallback
}

function toCamelCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}