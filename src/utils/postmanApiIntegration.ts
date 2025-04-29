import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { generatePostmanCollection } from "./postmanGenerator";

interface PostmanConfig {
  apiKey: string;
  collectionId?: string;
  workspaceId?: string;
}

/**
 * Directly updates a Postman collection with new endpoints
 */
export async function updatePostmanCollection(
  moduleName: string,
  camelCaseName: string,
  fields: any[],
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

      // Add the new folder to the existing collection
      collection.item.push(newCollection.item[0]);

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
 * Saves Postman configuration to a local file
 */
export function savePostmanConfig(config: PostmanConfig): void {
  const configDir = path.join(process.cwd(), ".siuuu");
  const configPath = path.join(configDir, "postman.json");

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Loads Postman configuration from a local file
 */
export function loadPostmanConfig(): PostmanConfig | null {
  const configPath = path.join(process.cwd(), ".siuuu", "postman.json");

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return config;
    } catch (error) {
      console.error("Error loading Postman config:", error);
    }
  }

  return null;
}
