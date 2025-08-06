import { FieldDefinition, SwaggerPath } from "../types";
import * as fs from "fs";
import * as path from "path";

export function generateSwaggerPaths(
  moduleName: string,
  fields: FieldDefinition[]
): { [path: string]: SwaggerPath } {
  const camelCaseName = toCamelCase(moduleName);
  const folderName = camelCaseName.toLowerCase();
  
  const schema = generateSwaggerSchema(camelCaseName, fields);
  const createSchema = generateSwaggerCreateSchema(camelCaseName, fields);
  const updateSchema = generateSwaggerUpdateSchema(camelCaseName, fields);
  
  return {
    [`/${folderName}`]: {
      post: {
        tags: [camelCaseName],
        summary: `Create a new ${camelCaseName}`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: `#/components/schemas/${camelCaseName}Create`
              }
            }
          }
        },
        responses: {
          "201": {
            description: `${camelCaseName} created successfully`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      $ref: `#/components/schemas/${camelCaseName}`
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request"
          }
        }
      },
      get: {
        tags: [camelCaseName],
        summary: `Get all ${camelCaseName}s`,
        responses: {
          "200": {
            description: `List of ${camelCaseName}s retrieved successfully`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "array",
                      items: {
                        $ref: `#/components/schemas/${camelCaseName}`
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    [`/${folderName}/{id}`]: {
      get: {
        tags: [camelCaseName],
        summary: `Get ${camelCaseName} by ID`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            },
            description: `${camelCaseName} ID`
          }
        ],
        responses: {
          "200": {
            description: `${camelCaseName} retrieved successfully`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      $ref: `#/components/schemas/${camelCaseName}`
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: `${camelCaseName} not found`
          }
        }
      },
      patch: {
        tags: [camelCaseName],
        summary: `Update ${camelCaseName}`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            },
            description: `${camelCaseName} ID`
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: `#/components/schemas/${camelCaseName}Update`
              }
            }
          }
        },
        responses: {
          "200": {
            description: `${camelCaseName} updated successfully`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      $ref: `#/components/schemas/${camelCaseName}`
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: `${camelCaseName} not found`
          }
        }
      },
      delete: {
        tags: [camelCaseName],
        summary: `Delete ${camelCaseName}`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            },
            description: `${camelCaseName} ID`
          }
        ],
        responses: {
          "200": {
            description: `${camelCaseName} deleted successfully`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      $ref: `#/components/schemas/${camelCaseName}`
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: `${camelCaseName} not found`
          }
        }
      }
    }
  };
}

export function generateSwaggerSchemas(
  moduleName: string,
  fields: FieldDefinition[]
): { [schemaName: string]: any } {
  const camelCaseName = toCamelCase(moduleName);
  
  const schemas: { [schemaName: string]: any } = {};
  
  // Generate nested schemas for complex types
  fields.forEach(field => {
    if (field.type.toLowerCase() === "array" && 
        field.ref?.toLowerCase() === "object" && 
        field.objectProperties?.length) {
      const nestedSchemaName = `${toCamelCase(field.name)}Item`;
      schemas[nestedSchemaName] = generateSwaggerSchema(nestedSchemaName, field.objectProperties);
    }
  });
  
  // Main schema
  schemas[camelCaseName] = generateSwaggerSchema(camelCaseName, fields);
  schemas[`${camelCaseName}Create`] = generateSwaggerCreateSchema(camelCaseName, fields);
  schemas[`${camelCaseName}Update`] = generateSwaggerUpdateSchema(camelCaseName, fields);
  
  return schemas;
}

function generateSwaggerSchema(schemaName: string, fields: FieldDefinition[]): any {
  const properties: any = {
    _id: {
      type: "string",
      description: "MongoDB ObjectId"
    }
  };
  
  const required: string[] = ["_id"];
  
  fields.forEach(field => {
    if (field.name.toLowerCase() === "_id") return;
    
    properties[field.name] = mapFieldToSwaggerProperty(field);
    
    if (field.isRequired) {
      required.push(field.name);
    }
  });
  
  // Add timestamps
  properties.createdAt = {
    type: "string",
    format: "date-time",
    description: "Creation timestamp"
  };
  properties.updatedAt = {
    type: "string",
    format: "date-time",
    description: "Last update timestamp"
  };
  
  return {
    type: "object",
    properties,
    required
  };
}

function generateSwaggerCreateSchema(schemaName: string, fields: FieldDefinition[]): any {
  const properties: any = {};
  const required: string[] = [];
  
  fields.forEach(field => {
    if (field.name.toLowerCase() === "_id") return;
    
    properties[field.name] = mapFieldToSwaggerProperty(field);
    
    if (field.isRequired) {
      required.push(field.name);
    }
  });
  
  return {
    type: "object",
    properties,
    required
  };
}

function generateSwaggerUpdateSchema(schemaName: string, fields: FieldDefinition[]): any {
  const properties: any = {};
  
  fields.forEach(field => {
    if (field.name.toLowerCase() === "_id") return;
    
    properties[field.name] = mapFieldToSwaggerProperty(field);
  });
  
  return {
    type: "object",
    properties
  };
}

function mapFieldToSwaggerProperty(field: FieldDefinition): any {
  switch (field.type.toLowerCase()) {
    case "string":
      return {
        type: "string",
        description: `${field.name} field`
      };
    case "number":
      return {
        type: "number",
        description: `${field.name} field`
      };
    case "boolean":
      return {
        type: "boolean",
        description: `${field.name} field`
      };
    case "date":
      return {
        type: "string",
        format: "date-time",
        description: `${field.name} field`
      };
    case "enum":
      return {
        type: "string",
        enum: field.enumValues || [],
        description: `${field.name} field`
      };
    case "array":
      if (field.ref?.toLowerCase() === "object" && field.objectProperties?.length) {
        const nestedSchemaName = `${toCamelCase(field.name)}Item`;
        return {
          type: "array",
          items: {
            $ref: `#/components/schemas/${nestedSchemaName}`
          },
          description: `Array of ${field.name} objects`
        };
      } else if (field.arrayItemType?.toLowerCase() === "objectid") {
        return {
          type: "array",
          items: {
            type: "string"
          },
          description: `Array of ${field.name} references`
        };
      } else {
        return {
          type: "array",
          items: {
            type: "string"
          },
          description: `Array of ${field.name} items`
        };
      }
    case "object":
      if (field.objectProperties?.length) {
        const nestedProperties: any = {};
        field.objectProperties.forEach(prop => {
          nestedProperties[prop.name] = mapFieldToSwaggerProperty(prop);
        });
        return {
          type: "object",
          properties: nestedProperties,
          description: `${field.name} object`
        };
      } else {
        return {
          type: "object",
          description: `${field.name} object`
        };
      }
    case "objectid":
    case "id":
      return {
        type: "string",
        description: `${field.name} reference ID`
      };
    default:
      return {
        type: "string",
        description: `${field.name} field`
      };
  }
}

export function updateSwaggerFile(
  moduleName: string,
  fields: FieldDefinition[],
  swaggerFilePath: string = "swagger.json"
): void {
  const fullPath = path.join(process.cwd(), swaggerFilePath);
  
  let swaggerDoc: any = {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Generated API documentation"
    },
    paths: {},
    components: {
      schemas: {}
    }
  };
  
  // Load existing swagger file if it exists
  if (fs.existsSync(fullPath)) {
    try {
      const existingContent = fs.readFileSync(fullPath, "utf-8");
      swaggerDoc = JSON.parse(existingContent);
    } catch (error) {
      console.warn("Could not parse existing swagger file, creating new one");
    }
  }
  
  // Generate new paths and schemas
  const newPaths = generateSwaggerPaths(moduleName, fields);
  const newSchemas = generateSwaggerSchemas(moduleName, fields);
  
  // Merge with existing
  swaggerDoc.paths = { ...swaggerDoc.paths, ...newPaths };
  swaggerDoc.components.schemas = { ...swaggerDoc.components.schemas, ...newSchemas };
  
  // Write updated swagger file
  fs.writeFileSync(fullPath, JSON.stringify(swaggerDoc, null, 2));
  
  console.log(`✅ Swagger documentation updated: ${fullPath}`);
}

function toCamelCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}