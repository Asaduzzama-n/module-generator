import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { generatePostmanCollection } from "./postmanGenerator";

interface PostmanConfig {
  apiKey: string;
  collectionId?: string;
  workspaceId?: string;
  baseUrl?: string;
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
 * Directly updates a Postman collection with new endpoints
 */
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

    // We need either a collection ID or workspace ID
    if (!config.collectionId && !config.workspaceId) {
      throw new Error(
        "Either Postman collection ID or workspace ID is required"
      );
    }

    const headers = {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
    };

    // If we have a collection ID, update that collection
    if (config.collectionId) {
      // First get the existing collection
      const response = await axios.get(
        `https://api.getpostman.com/collections/${config.collectionId}`,
        { headers }
      );

      const collection = response.data.collection;

      // Generate the new folder with endpoints for this module
      const newCollection = generatePostmanCollection(
        moduleName,
        camelCaseName,
        fields,
        baseUrl
      );

      // Check if a folder for this module already exists
      const moduleFolder = collection.item.find(
        (item: any) =>
          item.name.toLowerCase() === `${camelCaseName} Endpoints`.toLowerCase()
      );

      if (moduleFolder) {
        // Replace the existing folder with the new one
        const index = collection.item.indexOf(moduleFolder);
        collection.item[index] = newCollection.item[0];
      } else {
        // Add the new folder to the existing collection
        collection.item.push(newCollection.item[0]);
      }

      // Update the collection via Postman API
      await axios.put(
        `https://api.getpostman.com/collections/${config.collectionId}`,
        { collection },
        { headers }
      );

      return `Successfully updated Postman collection with ${camelCaseName} endpoints`;
    }
    // If we have a workspace ID but no collection ID, create a new collection in that workspace
    else if (config.workspaceId) {
      // Generate a new collection for this module
      const collection = generatePostmanCollection(
        moduleName,
        camelCaseName,
        fields,
        baseUrl
      );

      // Create a new collection in the specified workspace
      await axios.post(
        `https://api.getpostman.com/collections?workspace=${config.workspaceId}`,
        { collection },
        { headers }
      );

      return `Successfully created new Postman collection for ${camelCaseName} in workspace`;
    }

    throw new Error("Invalid Postman configuration");
  } catch (error) {
    console.error("Error updating Postman collection:", error);
    throw error;
  }
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
