import { PostmanCollection } from "../types";

export interface PostmanApiConfig {
    apiKey: string;
    collectionId: string;
}

/**
 * Updates an existing Postman collection via the Postman API.
 * It fetches the existing collection, finds the folder for the current module,
 * and replaces it or adds it to the collection.
 */
export async function updatePostmanCollectionViaApi(
    moduleName: string,
    newCollectionData: PostmanCollection,
    config: PostmanApiConfig
): Promise<void> {
    const { apiKey, collectionId } = config;
    const url = `https://api.getpostman.com/collections/${collectionId}`;

    try {
        console.log(`🚀 Connecting to Postman API for collection: ${collectionId}...`);

        // 1. Fetch current collection
        const getResponse = await fetch(url, {
            headers: {
                "X-Api-Key": apiKey
            }
        });

        if (!getResponse.ok) {
            const errorData = await getResponse.json();
            throw new Error(`Failed to fetch collection: ${JSON.stringify(errorData)}`);
        }

        const currentData = await getResponse.json();
        const collection = currentData.collection;

        console.log(`📦 Collection Keys: ${Object.keys(collection).join(", ")}`);

        // Handle variables - Postman API is very strict about variable structure
        if (collection.variable) {
            console.log(`🔍 Found ${collection.variable.length} variables in collection.`);
            if (collection.variable.length > 0) {
                console.log(`📄 Sample Variable [0]: ${JSON.stringify(collection.variable[0])}`);
            }

            const allowedTypes = ["string", "secret", "boolean", "number", "any"];

            // Filter and sanitize variables
            const validVariables = collection.variable
                .map((v: any) => {
                    const currentType = v.type?.toLowerCase();
                    if (!currentType || !allowedTypes.includes(currentType)) {
                        // Force to 'string' if invalid or missing
                        const newType = "string";
                        console.log(`  🔧 Variable '${v.key}' has invalid/missing type: '${v.type || "N/A"}'. Setting to '${newType}'.`);
                        return { ...v, type: newType };
                    }
                    return v;
                })
                .filter((v: any) => v.key && v.type); // Remove any variables without key or type

            // Only keep variable array if it has valid entries
            if (validVariables.length > 0) {
                collection.variable = validVariables;
            } else {
                console.log("  🗑️ Removing empty/invalid variable array");
                delete collection.variable;
            }
        } else {
            console.log("ℹ️ No variables found in retrieved collection.");
        }

        // 2. Prepare the new folder for this module
        // The generator creates a collection where 'item' is the list of requests
        const moduleFolderName = `${moduleName} API`;
        const newModuleFolder = {
            name: moduleFolderName,
            item: newCollectionData.item
        };

        // 3. Update or Add the folder in the existing collection
        if (!collection.item) {
            collection.item = [];
        }

        const existingFolderIndex = collection.item.findIndex(
            (item: any) => item.name === moduleFolderName
        );

        if (existingFolderIndex !== -1) {
            console.log(`📝 Updating existing folder: ${moduleFolderName} in Postman collection`);
            collection.item[existingFolderIndex] = newModuleFolder;
        } else {
            console.log(`➕ Adding new folder: ${moduleFolderName} to Postman collection`);
            collection.item.push(newModuleFolder);
        }

        // Debug: Log a snippet of what we are sending
        console.log(`📤 Sending PUT request to Postman API...`);
        // console.log(`📤 Variable snippet: ${JSON.stringify(collection.variable?.slice(0, 1))}`);

        // 4. Send the updated collection back to Postman
        const putResponse = await fetch(url, {
            method: "PUT",
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ collection })
        });

        if (!putResponse.ok) {
            const errorData = await putResponse.json();
            throw new Error(`Failed to update collection: ${JSON.stringify(errorData)}`);
        }

        console.log(`✅ Postman collection updated successfully via API!`);
    } catch (error) {
        console.error("❌ Error updating Postman collection via API:", error instanceof Error ? error.message : String(error));
        throw error;
    }
}
