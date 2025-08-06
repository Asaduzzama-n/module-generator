import { FieldDefinition } from "../types";

export function generateModelContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string {
  let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface';\n\n`;

  // Generate nested schemas
  const nestedSchemas = generateNestedSchemas(fields);
  modelContent += nestedSchemas;

  modelContent += `const ${folderName}Schema = new Schema<I${camelCaseName}, ${camelCaseName}Model>({\n`;

  // Add fields to schema
  if (fields.length > 0) {
    fields.forEach((field) => {
      // Skip _id field as it's automatically handled by MongoDB
      if (field.name.toLowerCase() === "_id") {
        return;
      }

      let schemaType = mapToMongooseType(field);
      if (!schemaType) return; // Skip if empty (like for _id)

      let additionalProps = "";

      // Add required property if marked as required
      if (field.isRequired) {
        additionalProps += ", required: true";
      }

      // Add default value for enum if it has values
      if (
        field.type.toLowerCase() === "enum" &&
        field.enumValues &&
        field.enumValues.length > 0
      ) {
        additionalProps += `, default: '${field.enumValues[0]}'`;
      }

      modelContent += `  ${field.name}: ${schemaType}${additionalProps},\n`;
    });
  } else {
    modelContent += "  // Define schema fields here\n";
  }

  modelContent += `}, {\n  timestamps: true\n});\n\nexport const ${camelCaseName} = model<I${camelCaseName}, ${camelCaseName}Model>('${camelCaseName}', ${folderName}Schema);\n`;

  return modelContent;
}

// Helper function to generate nested schemas for complex types
function generateNestedSchemas(fields: FieldDefinition[]): string {
  let nestedSchemas = "";

  fields.forEach((field) => {
    if (
      field.type.toLowerCase() === "array" &&
      field.ref?.toLowerCase() === "object" &&
      field.objectProperties?.length
    ) {
      const nestedSchemaName = `${field.name}ItemSchema`;
      nestedSchemas += `const ${nestedSchemaName} = new Schema({\n`;

      field.objectProperties.forEach((prop) => {
        // Skip _id field
        if (prop.name.toLowerCase() === "_id") {
          return;
        }

        let schemaType = mapToMongooseType(prop);
        let additionalProps = "";

        if (prop.isRequired) {
          additionalProps += ", required: true";
        }

        nestedSchemas += `  ${prop.name}: ${schemaType}${additionalProps},\n`;
      });

      nestedSchemas += `}, { _id: false });\n\n`;
    }
  });

  return nestedSchemas;
}

// Helper function to map field definitions to Mongoose schema types
function mapToMongooseType(field: FieldDefinition): string {
  // Skip _id field as it's automatically handled by MongoDB
  if (field.name.toLowerCase() === "_id") {
    return ""; // Skip this field
  }

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
            return `{ type: [Schema.Types.ObjectId], ref: '${
              field.ref || "Document"
            }' }`;
          default:
            return "{ type: [String] }"; // Default to String instead of Mixed
        }
      } else if (field.ref) {
        // Handle array of references (e.g., products:array:objectid:Product)
        return `{ type: [Schema.Types.ObjectId], ref: '${field.ref}' }`;
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
