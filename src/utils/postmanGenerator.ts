import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

interface FieldDefinition {
  name: string;
  type: string;
  ref?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  enumValues?: string[];
  objectProperties?: FieldDefinition[];
  arrayItemType?: string;
}

// Generate dummy data based on field type
function generateDummyValue(field: FieldDefinition): any {
  switch (field.type.toLowerCase()) {
    case "string":
      if (field.name.includes("email")) return "user@example.com";
      if (field.name.includes("name")) return "Sample Name";
      if (field.name.includes("image") || field.name.includes("avatar"))
        return "https://example.com/image.jpg";
      if (field.name.includes("phone")) return "+1234567890";
      if (field.name.includes("address")) return "123 Sample Street";
      if (field.name.includes("description"))
        return "This is a sample description";
      return "Sample text";

    case "number":
      if (field.name.includes("age")) return 25;
      if (field.name.includes("price")) return 99.99;
      if (field.name.includes("quantity")) return 10;
      return 42;

    case "boolean":
      return true;

    case "date":
      return new Date().toISOString();

    case "objectid":
      return "507f1f77bcf86cd799439011";

    case "array":
      if (field.arrayItemType === "string")
        return ["Sample item 1", "Sample item 2"];
      if (field.arrayItemType === "number") return [1, 2, 3];
      if (field.arrayItemType === "objectid")
        return ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"];
      if (field.arrayItemType === "object" && field.objectProperties) {
        return [generateObjectFromFields(field.objectProperties)];
      }
      return [];

    case "object":
      if (field.objectProperties) {
        return generateObjectFromFields(field.objectProperties);
      }
      return {};

    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        return field.enumValues[0];
      }
      return "ENUM_VALUE";

    default:
      return "Sample value";
  }
}

// Generate a complete object from field definitions
function generateObjectFromFields(
  fields: FieldDefinition[]
): Record<string, any> {
  const result: Record<string, any> = {};

  fields.forEach((field) => {
    result[field.name] = generateDummyValue(field);
  });

  return result;
}

// Create a Postman collection for a module
export function generatePostmanCollection(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  baseUrl: string = "http://localhost:5000/api/v1"
): any {
  const folderName = moduleName.toLowerCase();
  const dummyData = generateObjectFromFields(fields);
  const collectionId = uuidv4();
  const folderId = uuidv4();

  // Create endpoints for CRUD operations
  const endpoints = [
    {
      name: `Create ${camelCaseName}`,
      request: {
        method: "POST",
        header: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        url: {
          raw: `{{baseUrl}}/${folderName}s`,
          host: ["{{baseUrl}}"],
          path: [`${folderName}s`],
        },
        body: {
          mode: "raw",
          raw: JSON.stringify(dummyData, null, 2),
          options: {
            raw: {
              language: "json",
            },
          },
        },
        description: `Create a new ${camelCaseName}`,
      },
      response: [],
    },
    {
      name: `Get All ${camelCaseName}s`,
      request: {
        method: "GET",
        header: [],
        url: {
          raw: `{{baseUrl}}/${folderName}s`,
          host: ["{{baseUrl}}"],
          path: [`${folderName}s`],
        },
        description: `Get all ${camelCaseName}s`,
      },
      response: [],
    },
    {
      name: `Get Single ${camelCaseName}`,
      request: {
        method: "GET",
        header: [],
        url: {
          raw: `{{baseUrl}}/${folderName}s/:id`,
          host: ["{{baseUrl}}"],
          path: [`${folderName}s`, ":id"],
          variable: [
            {
              key: "id",
              value: "507f1f77bcf86cd799439011",
              description: `ID of the ${camelCaseName}`,
            },
          ],
        },
        description: `Get a single ${camelCaseName} by ID`,
      },
      response: [],
    },
    {
      name: `Update ${camelCaseName}`,
      request: {
        method: "PATCH",
        header: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        url: {
          raw: `{{baseUrl}}/${folderName}s/:id`,
          host: ["{{baseUrl}}"],
          path: [`${folderName}s`, ":id"],
          variable: [
            {
              key: "id",
              value: "507f1f77bcf86cd799439011",
              description: `ID of the ${camelCaseName}`,
            },
          ],
        },
        body: {
          mode: "raw",
          raw: JSON.stringify(dummyData, null, 2),
          options: {
            raw: {
              language: "json",
            },
          },
        },
        description: `Update a ${camelCaseName}`,
      },
      response: [],
    },
    {
      name: `Delete ${camelCaseName}`,
      request: {
        method: "DELETE",
        header: [],
        url: {
          raw: `{{baseUrl}}/${folderName}s/:id`,
          host: ["{{baseUrl}}"],
          path: [`${folderName}s`, ":id"],
          variable: [
            {
              key: "id",
              value: "507f1f77bcf86cd799439011",
              description: `ID of the ${camelCaseName}`,
            },
          ],
        },
        description: `Delete a ${camelCaseName}`,
      },
      response: [],
    },
  ];

  // Create the collection structure
  const collection = {
    info: {
      _postman_id: collectionId,
      name: `${camelCaseName} API`,
      description: `API endpoints for ${camelCaseName} module`,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      {
        name: `${camelCaseName} Endpoints`,
        _postman_id: folderId,
        item: endpoints,
        description: `Endpoints for ${camelCaseName} module`,
      },
    ],
    variable: [
      {
        key: "baseUrl",
        value: baseUrl,
        type: "string",
      },
    ],
  };

  return collection;
}

// Save Postman collection to file
export function savePostmanCollection(
  moduleName: string,
  collection: any,
  outputDir: string = "postman-collections"
): string {
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(
    outputDir,
    `${moduleName.toLowerCase()}-collection.json`
  );
  fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));

  return filePath;
}

// Check if a collection exists
export function collectionExists(
  moduleName: string,
  outputDir: string = "postman-collections"
): boolean {
  const filePath = path.join(
    outputDir,
    `${moduleName.toLowerCase()}-collection.json`
  );
  return fs.existsSync(filePath);
}

// Add endpoints to an existing collection
export function addEndpointsToCollection(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  outputDir: string = "postman-collections",
  baseUrl: string = "http://localhost:5000/api/v1"
): string | null {
  const filePath = path.join(
    outputDir,
    `${moduleName.toLowerCase()}-collection.json`
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const collection = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const folderName = moduleName.toLowerCase();
    const dummyData = generateObjectFromFields(fields);
    const folderId = uuidv4();

    // Create endpoints for CRUD operations
    const endpoints = [
      {
        name: `Create ${camelCaseName}`,
        request: {
          method: "POST",
          header: [
            {
              key: "Content-Type",
              value: "application/json",
            },
          ],
          url: {
            raw: `{{baseUrl}}/${folderName}s`,
            host: ["{{baseUrl}}"],
            path: [`${folderName}s`],
          },
          body: {
            mode: "raw",
            raw: JSON.stringify(dummyData, null, 2),
            options: {
              raw: {
                language: "json",
              },
            },
          },
          description: `Create a new ${camelCaseName}`,
        },
        response: [],
      },
      // ... other endpoints similar to the generatePostmanCollection function
    ];

    // Add new folder with endpoints to collection
    collection.item.push({
      name: `${camelCaseName} Endpoints`,
      _postman_id: folderId,
      item: endpoints,
      description: `Endpoints for ${camelCaseName} module`,
    });

    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
    return filePath;
  } catch (error) {
    console.error("Error adding endpoints to collection:", error);
    return null;
  }
}
