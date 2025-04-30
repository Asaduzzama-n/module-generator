// @ts-nocheck

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

interface PostmanConfig {
  apiKey: string;
  collectionId?: string;
  workspaceId?: string;
  baseUrl?: string;
  projectName?: string;
}

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

/**
 * Loads Postman configuration from package.json
 */
export function loadPostmanConfig(): PostmanConfig | null {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    if (!packageJson.moduleGenerator || !packageJson.moduleGenerator.postman) {
      return null;
    }

    return packageJson.moduleGenerator.postman;
  } catch (error) {
    console.error("Error loading Postman config:", error);
    return null;
  }
}

/**
 * Generates a sample request body based on field definitions
 */
function generateSampleRequestBody(fields: FieldDefinition[]): any {
  const body: any = {};

  fields.forEach((field) => {
    switch (field.type) {
      case "string":
        body[field.name] = field.enumValues
          ? field.enumValues[0]
          : "Sample text";
        break;
      case "number":
        body[field.name] = 123;
        break;
      case "boolean":
        body[field.name] = true;
        break;
      case "date":
        body[field.name] = new Date().toISOString();
        break;
      case "objectId":
        body[field.name] = "507f1f77bcf86cd799439011";
        break;
      case "object":
        if (field.objectProperties) {
          body[field.name] = generateSampleRequestBody(field.objectProperties);
        } else {
          body[field.name] = {};
        }
        break;
      case "array":
        if (field.arrayItemType === "string") {
          body[field.name] = ["Sample item"];
        } else if (field.arrayItemType === "number") {
          body[field.name] = [123];
        } else if (field.arrayItemType === "object" && field.objectProperties) {
          body[field.name] = [
            generateSampleRequestBody(field.objectProperties),
          ];
        } else {
          body[field.name] = [];
        }
        break;
      default:
        body[field.name] = null;
    }
  });

  return body;
}

/**
 * Integrates a newly created module with Postman
 */
export async function integrateModuleWithPostman(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[]
): Promise<string> {
  try {
    // Load Postman configuration from package.json
    const config = loadPostmanConfig();
    if (!config) {
      throw new Error("Postman configuration not found in package.json");
    }

    if (!config.apiKey || !config.collectionId) {
      throw new Error("Postman API key and collection ID are required");
    }

    const baseUrl = config.baseUrl || "http://localhost:5000/api/v1";

    // Update the Postman collection with the new module endpoints
    return await updatePostmanCollection(
      moduleName,
      camelCaseName,
      fields,
      config,
      baseUrl
    );
  } catch (error) {
    console.error("Error integrating module with Postman:", error);
    throw error;
  }
}

/**
 * Updates a Postman collection with new module endpoints
 */
export async function updatePostmanCollection(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  config: PostmanConfig,
  baseUrl: string = "http://localhost:5000/api/v1"
): Promise<string> {
  try {
    if (!config.apiKey) throw new Error("Postman API key is required");
    if (!config.collectionId)
      throw new Error("Postman Collection ID is required");

    const headers = {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
    };

    console.log(`Fetching collection ${config.collectionId}`);

    // Clean the collection ID
    const cleanCollectionId = config.collectionId.trim().replace(/`/g, "");

    // Get the existing collection
    const getResponse = await axios.get(
      `https://api.getpostman.com/collections/${cleanCollectionId}`,
      { headers }
    );

    if (!getResponse.data || !getResponse.data.collection) {
      throw new Error(
        `Failed to retrieve collection with ID: ${cleanCollectionId}`
      );
    }

    // Clone the collection to avoid reference issues
    const collection = JSON.parse(JSON.stringify(getResponse.data.collection));

    // Create the module folder with endpoints
    const moduleFolder = createModuleFolder(
      moduleName,
      camelCaseName,
      fields,
      baseUrl
    );

    // Check if collection.item exists and is an array
    if (!Array.isArray(collection.item)) {
      collection.item = [];
    }

    // Check if the module folder already exists
    const existingModuleIndex = collection.item.findIndex(
      (item: any) => item.name === camelCaseName
    );

    if (existingModuleIndex !== -1) {
      console.log(`Updating existing module folder: ${camelCaseName}`);
      collection.item[existingModuleIndex] = moduleFolder;
    } else {
      console.log(`Adding new module folder: ${camelCaseName}`);
      collection.item.push(moduleFolder);
    }

    console.log(`Updating collection with new module: ${camelCaseName}`);

    // Update the collection
    const updateResponse = await axios.put(
      `https://api.getpostman.com/collections/${cleanCollectionId}`,
      { collection },
      { headers }
    );

    if (!updateResponse.data || !updateResponse.data.collection) {
      console.error("Update response:", JSON.stringify(updateResponse.data));
      throw new Error(
        `Failed to update collection with ID: ${cleanCollectionId}`
      );
    }

    return `Successfully added ${camelCaseName} endpoints to Postman collection`;
  } catch (error) {
    console.error("Error updating Postman collection:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data));
    }
    throw new Error(`Failed to update Postman collection: ${error.message}`);
  }
}

/**
 * Creates a module folder with endpoints
 */
function createModuleFolder(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  baseUrl: string
): any {
  const folderName = moduleName.toLowerCase();

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
          raw: JSON.stringify(generateSampleRequestBody(fields), null, 2),
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
      name: `Get ${camelCaseName} By ID`,
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
          raw: JSON.stringify(generateSampleRequestBody(fields), null, 2),
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

  // Create the module folder
  return {
    name: camelCaseName,
    _postman_id: uuidv4(),
    item: endpoints,
    description: `Endpoints for ${camelCaseName} module`,
  };
}
