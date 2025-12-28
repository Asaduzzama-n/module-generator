import { FieldDefinition, PostmanCollection, PostmanRequest } from "../types";
import * as fs from "fs";
import * as path from "path";

// Helper to generate Pre-request Script
function generatePreRequestScript(fields: FieldDefinition[], prefix: string = ""): string[] {
    const scriptLines: string[] = [];

    fields.forEach(field => {
        if (field.name.toLowerCase() === "_id") return;

        const varName = prefix ? `${prefix}_${field.name}` : field.name;

        switch (field.type.toLowerCase()) {
            case "string":
                scriptLines.push(`pm.variables.set("${varName}", "${field.name}_" + Date.now());`);
                break;
            case "number":
                scriptLines.push(`pm.variables.set("${varName}", Math.floor(Math.random() * 100));`);
                break;
            case "boolean":
                scriptLines.push(`pm.variables.set("${varName}", Math.random() < 0.5);`);
                break;
            case "date":
                scriptLines.push(`pm.variables.set("${varName}", new Date().toISOString());`);
                break;
            case "enum":
                if (field.enumValues && field.enumValues.length > 0) {
                    const values = JSON.stringify(field.enumValues);
                    scriptLines.push(`const ${varName}_values = ${values};`);
                    scriptLines.push(`pm.variables.set("${varName}", ${varName}_values[Math.floor(Math.random() * ${varName}_values.length)]);`);
                } else {
                    scriptLines.push(`pm.variables.set("${varName}", "ENUM_VALUE");`);
                }
                break;
            case "object":
                if (field.objectProperties?.length) {
                    // Recursive call for nested properties
                    const nestedPrefix = varName;
                    scriptLines.push(...generatePreRequestScript(field.objectProperties, nestedPrefix));
                }
                break;
            case "array":
                if (field.ref?.toLowerCase() === "object" && field.objectProperties?.length) {
                    // For array of objects, we generate one item's structure
                    // This is a simplification but helps with pre-request variable setting
                    scriptLines.push(...generatePreRequestScript(field.objectProperties, varName));
                }
                break;
        }
    });

    return scriptLines;
}

export function generatePostmanCollection(
    moduleName: string,
    fields: FieldDefinition[]
): PostmanCollection {
    const camelCaseName = toCamelCase(moduleName);
    const folderName = camelCaseName.toLowerCase();
    const baseUrl = "{{base_url}}";

    const sampleData = generateSampleData(fields);

    const requests: PostmanRequest[] = [
        // Create request
        {
            name: `Create ${camelCaseName}`,
            request: {
                method: "POST",
                header: [
                    {
                        key: "Content-Type",
                        value: "application/json"
                    }
                ],
                body: {
                    mode: "raw",
                    raw: JSON.stringify(sampleData, null, 2),
                    options: {
                        raw: {
                            language: "json"
                        }
                    }
                },
                url: {
                    raw: `${baseUrl}/api/v1/${folderName}`,
                    host: ["{{base_url}}"],
                    path: ["api", "v1", folderName]
                }
            },
            event: [
                {
                    listen: "prerequest",
                    script: {
                        exec: generatePreRequestScript(fields),
                        type: "text/javascript"
                    }
                }
            ]
        },

        // Get all request
        {
            name: `Get All ${camelCaseName}s`,
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: `${baseUrl}/api/v1/${folderName}`,
                    host: ["{{base_url}}"],
                    path: ["api", "v1", folderName]
                }
            }
        },

        // Get single request
        {
            name: `Get ${camelCaseName} by ID`,
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: `${baseUrl}/api/v1/${folderName}/{{${folderName}_id}}`,
                    host: ["{{base_url}}"],
                    path: ["api", "v1", folderName, `{{${folderName}_id}}`]
                }
            }
        },

        // Update request
        {
            name: `Update ${camelCaseName}`,
            request: {
                method: "PATCH",
                header: [
                    {
                        key: "Content-Type",
                        value: "application/json"
                    }
                ],
                body: {
                    mode: "raw",
                    raw: JSON.stringify(generateUpdateSampleData(fields), null, 2),
                    options: {
                        raw: {
                            language: "json"
                        }
                    }
                },
                url: {
                    raw: `${baseUrl}/api/v1/${folderName}/{{${folderName}_id}}`,
                    host: ["{{base_url}}"],
                    path: ["api", "v1", folderName, `{{${folderName}_id}}`]
                }
            },
            event: [
                {
                    listen: "prerequest",
                    script: {
                        exec: generatePreRequestScript(fields),
                        type: "text/javascript"
                    }
                }
            ]
        },

        // Delete request
        {
            name: `Delete ${camelCaseName}`,
            request: {
                method: "DELETE",
                header: [],
                url: {
                    raw: `${baseUrl}/api/v1/${folderName}/{{${folderName}_id}}`,
                    host: ["{{base_url}}"],
                    path: ["api", "v1", folderName, `{{${folderName}_id}}`]
                }
            }
        }
    ];

    return {
        info: {
            name: `${camelCaseName} API`,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: requests
    };
}

export function savePostmanCollection(
    moduleName: string,
    collection: PostmanCollection,
    outputDir: string = "postman"
): void {
    const camelCaseName = toCamelCase(moduleName);
    const postmanDir = path.join(process.cwd(), outputDir);

    // Create postman directory if it doesn't exist
    if (!fs.existsSync(postmanDir)) {
        fs.mkdirSync(postmanDir, { recursive: true });
    }

    const filePath = path.join(postmanDir, `${camelCaseName.toLowerCase()}.postman_collection.json`);

    let finalCollection = collection;

    // Check if the file already exists to merge endpoints
    if (fs.existsSync(filePath)) {
        try {
            const existingContent = fs.readFileSync(filePath, "utf-8");
            const existingCollection = JSON.parse(existingContent);

            if (existingCollection.item && Array.isArray(existingCollection.item)) {
                console.log(`🔄 Merging with existing local collection: ${filePath}`);

                const existingItems = existingCollection.item;
                const newItems = collection.item;

                // Create a map of new items by name
                const newItemsMap = new Map(newItems.map((item: any) => [item.name, item]));

                // Keep manual items (those not in the generated set)
                const manualItems = existingItems.filter((existingItem: any) => !newItemsMap.has(existingItem.name));

                if (manualItems.length > 0) {
                    console.log(`   ✨ Preserving ${manualItems.length} manual endpoints in local file: ${manualItems.map((m: any) => m.name).join(', ')}`);
                }

                // Final items = new generated items + manual items
                finalCollection = {
                    ...collection,
                    item: [...newItems, ...manualItems]
                };
            }
        } catch (error) {
            console.warn(`⚠️  Could not parse existing Postman collection at ${filePath}, overwriting instead.`);
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(finalCollection, null, 2));

    console.log(`✅ Postman collection ${fs.existsSync(filePath) ? 'updated' : 'created'}: ${filePath}`);
}

function generateSampleData(fields: FieldDefinition[], prefix: string = ""): any {
    const sampleData: any = {};

    fields.forEach(field => {
        if (field.name.toLowerCase() === "_id") return;

        const varName = prefix ? `${prefix}_${field.name}` : field.name;

        switch (field.type.toLowerCase()) {
            case "string":
            case "number":
            case "boolean":
            case "date":
            case "enum":
            case "objectid":
            case "id":
                sampleData[field.name] = `{{${varName}}}`;
                break;
            case "array":
                if (field.ref?.toLowerCase() === "object" && field.objectProperties?.length) {
                    // Array of objects - return one item with variable placeholders
                    sampleData[field.name] = [generateSampleData(field.objectProperties, varName)];
                } else if (field.arrayItemType) {
                    // ... existing logic for scalar arrays ...
                    sampleData[field.name] = []; // Placeholder for scalar array for now
                } else {
                    sampleData[field.name] = [];
                }
                break;
            case "object":
                if (field.objectProperties?.length) {
                    sampleData[field.name] = generateSampleData(field.objectProperties, varName);
                } else {
                    sampleData[field.name] = {};
                }
                break;
            default:
                sampleData[field.name] = `{{${varName}}}`;
        }
    });

    return sampleData;
}

function generateUpdateSampleData(fields: FieldDefinition[]): any {
    const sampleData = generateSampleData(fields);

    // For update, we typically only include a few fields
    const updateFields: any = {};
    const fieldNames = Object.keys(sampleData);

    // Include first 2-3 fields for update example
    fieldNames.slice(0, Math.min(3, fieldNames.length)).forEach(fieldName => {
        updateFields[fieldName] = sampleData[fieldName];
    });

    return updateFields;
}

function toCamelCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Saves a full Postman collection to a specific file.
 */
export function saveFullPostmanCollection(
    collection: any,
    outputFilePath: string = "postman/full_collection.postman_collection.json"
): void {
    try {
        const fullPath = path.isAbsolute(outputFilePath)
            ? outputFilePath
            : path.join(process.cwd(), outputFilePath);

        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, JSON.stringify({ collection }, null, 2));
        console.log(`✅ Full Postman collection exported to: ${fullPath}`);
    } catch (error) {
        console.error("❌ Error saving full Postman collection:", error instanceof Error ? error.message : String(error));
        throw error;
    }
}