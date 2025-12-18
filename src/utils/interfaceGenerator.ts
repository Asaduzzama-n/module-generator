import { FieldDefinition } from "../types";

export function generateInterfaceContent(
  camelCaseName: string,
  fields: FieldDefinition[]
): string {
  let interfaceContent = `import { Model, Types } from 'mongoose';\n\n`;

  // Generate nested interfaces for array of objects
  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedInterfaceName = `${toCamelCase(field.name)}Item`;
      interfaceContent += `export interface ${nestedInterfaceName} {\n`;

      field.objectProperties.forEach((prop) => {
        // Skip _id field
        if (prop.name.toLowerCase() === "_id") {
          return;
        }

        const optionalMarker = prop.isOptional ? "?" : "";
        const tsType = mapToTypeScriptType(prop);
        interfaceContent += `  ${prop.name}${optionalMarker}: ${tsType};\n`;
      });

      interfaceContent += `}\n\n`;
    }
  });

  // Generate enum types
  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "enum" &&
      field.enumValues &&
      field.enumValues.length > 0
    ) {
      const enumName = `${toCamelCase(field.name)}Enum`;
      interfaceContent += `export enum ${enumName} {\n`;
      field.enumValues.forEach(value => {
        // Handle special characters in enum keys if necessary, simplified for now
        const key = value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        interfaceContent += `  ${key} = '${value}',\n`;
      });
      interfaceContent += `}\n\n`;
    }
  });

  // Generate filterable interface
  const filterableFields = fields.filter(
    f => f.type.toLowerCase() === "string" || f.type.toLowerCase() === "enum"
  );

  if (filterableFields.length > 0) {
    interfaceContent += `export interface I${camelCaseName}Filterables {\n`;
    interfaceContent += `  searchTerm?: string;\n`;

    filterableFields.forEach((field) => {
      let tsType = mapToTypeScriptType(field);

      // Use enum type if applicable
      if (
        field.type.toLowerCase() === "enum" &&
        field.enumValues &&
        field.enumValues.length > 0
      ) {
        tsType = `${toCamelCase(field.name)}Enum`;
      }

      interfaceContent += `  ${field.name}?: ${tsType};\n`;
    });

    interfaceContent += `}\n\n`;
  }

  // Generate main interface
  interfaceContent += `export interface I${camelCaseName} {\n`;
  interfaceContent += `  _id: Types.ObjectId;\n`;

  if (fields.length > 0) {
    fields.forEach((field) => {
      // Skip _id field as it's already included
      if (field.name.toLowerCase() === "_id") {
        return;
      }

      const optionalMarker = field.isOptional ? "?" : "";
      let tsType = mapToTypeScriptType(field);

      // Use enum type if applicable
      if (
        field.type.toLowerCase() === "enum" &&
        field.enumValues &&
        field.enumValues.length > 0
      ) {
        tsType = `${toCamelCase(field.name)}Enum`;
      }

      interfaceContent += `  ${field.name}${optionalMarker}: ${tsType};\n`;
    });
  } else {
    interfaceContent += `  // Define interface properties here\n`;
  }

  interfaceContent += `}\n\n`;

  // Generate model interface
  interfaceContent += `export type ${camelCaseName}Model = Model<I${camelCaseName}, {}, {}>;\n`;

  return interfaceContent;
}

// Helper function to convert to camelCase
function toCamelCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        return `${toCamelCase(field.name)}Enum`;
      }
      return "string";
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
      } else if (field.ref && field.type.toLowerCase() === "array") {
        // Handle array of references (e.g., products:array:objectid:Product)
        return "Types.ObjectId[]";
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
