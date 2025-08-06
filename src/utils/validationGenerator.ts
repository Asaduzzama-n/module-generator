import { FieldDefinition } from "../types";

export function generateValidationContent(
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
        // Skip _id field
        if (prop.name.toLowerCase() === "_id") {
          return;
        }

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

  // Create validation schema for create operation
  validationContent += `  create: z.object({\n`;
  validationContent += `    body: z.object({\n`;

  // Add validation for each field
  if (fields.length > 0) {
    fields.forEach((field) => {
      // Skip _id field
      if (field.name.toLowerCase() === "_id") {
        return;
      }

      let zodType = mapToZodType(field.type, field);

      // Add required/optional modifiers
      if (field.isRequired) {
        // Already required by default in Zod
      } else if (field.isOptional) {
        zodType += ".optional()";
      }

      validationContent += `      ${field.name}: ${zodType},\n`;
    });
  } else {
    validationContent += `      // Add validation fields\n`;
  }

  validationContent += `    }),\n`;

  // Add params validation for ID
  validationContent += `    params: z.object({\n`;
  validationContent += `      id: z.string(),\n`;
  validationContent += `    }).optional(),\n`;

  validationContent += `  }),\n\n`;

  // Add update validation schema (similar to create but all fields optional)
  validationContent += `  update: z.object({\n`;
  validationContent += `    body: z.object({\n`;

  if (fields.length > 0) {
    fields.forEach((field) => {
      // Skip _id field
      if (field.name.toLowerCase() === "_id") {
        return;
      }

      let zodType = mapToZodType(field.type, field);

      // All fields are optional in update
      zodType += ".optional()";

      validationContent += `      ${field.name}: ${zodType},\n`;
    });
  } else {
    validationContent += `      // Add validation fields\n`;
  }

  validationContent += `    }),\n`;

  // Add params validation for ID
  validationContent += `    params: z.object({\n`;
  validationContent += `      id: z.string(),\n`;
  validationContent += `    }),\n`;

  validationContent += `  }),\n\n`;

  // Add getById validation schema
  validationContent += `  getById: z.object({\n`;
  validationContent += `    params: z.object({\n`;
  validationContent += `      id: z.string(),\n`;
  validationContent += `    }),\n`;
  validationContent += `  }),\n\n`;

  // Add getAll validation schema with pagination
  validationContent += `  getAll: z.object({\n`;
  validationContent += `    query: z.object({\n`;
  validationContent += `      page: z.string().optional(),\n`;
  validationContent += `      limit: z.string().optional(),\n`;
  validationContent += `      sortBy: z.string().optional(),\n`;
  validationContent += `      sortOrder: z.string().optional(),\n`;
  validationContent += `    }).optional(),\n`;
  validationContent += `  }),\n\n`;

  // Add delete validation schema
  validationContent += `  delete: z.object({\n`;
  validationContent += `    params: z.object({\n`;
  validationContent += `      id: z.string(),\n`;
  validationContent += `    }),\n`;
  validationContent += `  }),\n`;

  validationContent += `};\n`;

  return validationContent;
}

// Helper function to map types to Zod validators
function mapToZodType(type: string, field?: FieldDefinition): string {
  switch (type.toLowerCase()) {
    case "string":
      if (field?.enumValues && field.enumValues.length > 0) {
        return `z.enum(['${field.enumValues.join("', '")}'])`;
      }
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "date":
      return "z.string().datetime()";
    case "enum":
      if (field?.enumValues && field.enumValues.length > 0) {
        return `z.enum(['${field.enumValues.join("', '")}'])`;
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
          // Array of references to other models (e.g., products:array:objectid:Product)
          return "z.array(z.string())";
        }
      } else if (field?.arrayItemType) {
        if (field.arrayItemType.toLowerCase() === "string") {
          return "z.array(z.string())";
        } else if (field.arrayItemType.toLowerCase() === "number") {
          return "z.array(z.number())";
        } else if (field.arrayItemType.toLowerCase() === "boolean") {
          return "z.array(z.boolean())";
        } else {
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
