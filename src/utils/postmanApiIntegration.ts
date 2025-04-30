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

// Generate module endpoints as a folder
// function generateModuleEndpoints(
//   moduleName: string,
//   camelCaseName: string,
//   fields: FieldDefinition[],
//   baseUrl: string = "http://localhost:5000/api/v1"
// ): any {
//   const folderName = moduleName.toLowerCase();
//   const folderId = uuidv4();

//   // Convert module name to uppercase with underscores for folder name
//   const upperCaseModuleName = camelCaseName
//     .replace(/([a-z])([A-Z])/g, "$1_$2")
//     .toUpperCase();

//   // Create endpoints for CRUD operations
//   const endpoints = [
//     {
//       name: `Create ${upperCaseModuleName}`,
//       request: {
//         method: "POST",
//         header: [
//           {
//             key: "Content-Type",
//             value: "application/json",
//           },
//         ],
//         url: {
//           raw: `{{baseUrl}}/${folderName}s`,
//           host: ["{{baseUrl}}"],
//           path: [`${folderName}s`],
//         },
//         body: {
//           mode: "raw",
//           raw: JSON.stringify(generateSampleRequestBody(fields), null, 2),
//           options: {
//             raw: {
//               language: "json",
//             },
//           },
//         },
//         description: `Create a new ${camelCaseName}`,
//       },
//       response: [],
//     },
//     // ... other endpoints
//   ];

//   // Create the folder structure for this module
//   return {
//     name: `${upperCaseModuleName} ENDPOINTS`,
//     _postman_id: folderId,
//     item: endpoints,
//     description: `Endpoints for ${camelCaseName} module`,
//   };
// }

/**
 * Directly updates a Postman collection with new endpoints
 */
// Add this helper function to convert names to uppercase with underscores
function toUpperCaseWithUnderscores(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}

export async function updatePostmanCollection(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  config: PostmanConfig,
  baseUrl: string = "http://localhost:5000/api/v1"
): Promise<string> {
  try {
    // First check if we have a valid API key
    if (!config.apiKey) {
      throw new Error("Postman API key is required");
    }

    const headers = {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
    };

    // Get project name from config or use a default
    const projectName = config.projectName || path.basename(process.cwd());

    // Convert project name to uppercase with underscores for collection name
    const upperCaseProjectName = projectName
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase();
    const collectionName = `${upperCaseProjectName} API`;

    // Convert module name to uppercase with underscores for folder name
    const upperCaseModuleName = camelCaseName
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase();

    // If we have a collection ID, update that collection
    if (config.collectionId) {
      console.log(`Using existing collection ID: ${config.collectionId}`);

      try {
        // First get the existing collection
        const response = await axios.get(
          `https://api.getpostman.com/collections/${config.collectionId}`,
          { headers }
        );

        const collection = response.data.collection;

        // Generate the module endpoints with uppercase naming
        const moduleEndpoints = generateModuleEndpoints(
          moduleName,
          camelCaseName,
          fields,
          baseUrl
        );

        // Check if a folder for this module already exists
        const moduleFolder = collection.item.find(
          (item: any) =>
            item.name.toLowerCase() ===
            `${upperCaseModuleName} ENDPOINTS`.toLowerCase()
        );

        if (moduleFolder) {
          // Replace the existing folder with the new one
          const index = collection.item.indexOf(moduleFolder);
          collection.item[index] = moduleEndpoints;
        } else {
          // Add the new folder to the existing collection
          collection.item.push(moduleEndpoints);
        }

        // Update the collection via Postman API
        await axios.put(
          `https://api.getpostman.com/collections/${config.collectionId}`,
          { collection },
          { headers }
        );

        return `Successfully updated Postman collection with ${upperCaseModuleName} endpoints`;
      } catch (error) {
        console.error("Error updating existing collection:", error);
        console.log("Creating a new collection instead...");
        // If there was an error (e.g., collection was deleted), create a new one
        config.collectionId = undefined;
      }
    }

    // If we don't have a collection ID, create a new collection
    console.log("Creating a new Postman collection...");

    // Generate a new collection for the project with this module
    const collection = {
      info: {
        _postman_id: uuidv4(),
        name: collectionName,
        description: `API endpoints for ${projectName}`,
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: [
        generateModuleEndpoints(moduleName, camelCaseName, fields, baseUrl),
      ],
      variable: [
        {
          key: "baseUrl",
          value: baseUrl,
          type: "string",
        },
      ],
    };

    // Create a new collection
    const response = await axios.post(
      `https://api.getpostman.com/collections${
        config.workspaceId ? `?workspace=${config.workspaceId}` : ""
      }`,
      { collection },
      { headers }
    );

    // Save the collection ID for future use
    if (
      response.data &&
      response.data.collection &&
      response.data.collection.uid
    ) {
      config.collectionId = response.data.collection.uid;
      savePostmanConfig(config);
      console.log(`Saved new collection ID: ${config.collectionId}`);
    }

    return `Successfully created new Postman collection for ${projectName} with ${upperCaseModuleName} module`;
  } catch (error) {
    console.error("Error updating Postman collection:", error);
    throw error;
  }
}

// Helper function to generate module endpoints with uppercase naming
function generateModuleEndpoints(
  moduleName: string,
  camelCaseName: string,
  fields: FieldDefinition[],
  baseUrl: string = "http://localhost:5000/api/v1"
): any {
  const folderName = moduleName.toLowerCase();
  const folderId = uuidv4();

  // Convert module name to uppercase with underscores
  const upperCaseModuleName = camelCaseName
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();

  // Create endpoints for CRUD operations with uppercase naming
  const endpoints = [
    {
      name: `CREATE ${upperCaseModuleName}`,
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
      name: `GET ALL ${upperCaseModuleName}S`,
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
      name: `GET ${upperCaseModuleName} BY ID`,
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
      name: `UPDATE ${upperCaseModuleName}`,
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
      name: `DELETE ${upperCaseModuleName}`,
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

  // Create the folder structure for this module
  return {
    name: `${upperCaseModuleName} ENDPOINTS`,
    _postman_id: folderId,
    item: endpoints,
    description: `Endpoints for ${camelCaseName} module`,
  };
}

/**
 * Saves Postman configuration to package.json
 */
export function savePostmanConfig(config: PostmanConfig): void {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      // Create or update the moduleGenerator section
      if (!packageJson.moduleGenerator) {
        packageJson.moduleGenerator = {};
      }

      // Add the postman configuration
      packageJson.moduleGenerator.postman = {
        apiKey: config.apiKey,
        collectionId: config.collectionId,
        workspaceId: config.workspaceId,
        baseUrl: config.baseUrl || "http://localhost:5000/api/v1",
        projectName: config.projectName || path.basename(process.cwd()),
      };

      // Write the updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
      console.error("Error saving Postman config to package.json:", error);
      throw error;
    }
  } else {
    throw new Error("package.json not found in the current directory");
  }
}

/**
 * Loads Postman configuration from package.json
 */
export function loadPostmanConfig(): PostmanConfig | null {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      if (packageJson.moduleGenerator && packageJson.moduleGenerator.postman) {
        return packageJson.moduleGenerator.postman;
      }
    } catch (error) {
      console.error("Error loading Postman config from package.json:", error);
    }
  }

  return null;
}

// Add this function to generate sample request body
function generateSampleRequestBody(
  fields: FieldDefinition[]
): Record<string, any> {
  const result: Record<string, any> = {};

  fields.forEach((field) => {
    result[field.name] = generateDummyValue(field);
  });

  return result;
}

// Add this function to generate dummy values
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

// Add this helper function
function generateObjectFromFields(
  fields: FieldDefinition[]
): Record<string, any> {
  const result: Record<string, any> = {};

  fields.forEach((field) => {
    result[field.name] = generateDummyValue(field);
  });

  return result;
}
