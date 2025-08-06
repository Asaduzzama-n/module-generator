import { FieldDefinition, PostmanCollection, PostmanRequest } from "../types";
import * as fs from "fs";
import * as path from "path";

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
            }
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
            }
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
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));

    console.log(`✅ Postman collection created: ${filePath}`);
}

function generateSampleData(fields: FieldDefinition[]): any {
    const sampleData: any = {};

    fields.forEach(field => {
        if (field.name.toLowerCase() === "_id") return;

        switch (field.type.toLowerCase()) {
            case "string":
                sampleData[field.name] = `sample_${field.name}`;
                break;
            case "number":
                sampleData[field.name] = 123;
                break;
            case "boolean":
                sampleData[field.name] = true;
                break;
            case "date":
                sampleData[field.name] = new Date().toISOString();
                break;
            case "enum":
                if (field.enumValues && field.enumValues.length > 0) {
                    sampleData[field.name] = field.enumValues[0];
                } else {
                    sampleData[field.name] = `sample_${field.name}`;
                }
                break;
            case "array":
                if (field.ref?.toLowerCase() === "object" && field.objectProperties?.length) {
                    sampleData[field.name] = [generateSampleData(field.objectProperties)];
                } else if (field.arrayItemType?.toLowerCase() === "objectid") {
                    sampleData[field.name] = ["507f1f77bcf86cd799439011"];
                } else if (field.arrayItemType) {
                    // Generate proper sample data based on array item type
                    switch (field.arrayItemType.toLowerCase()) {
                        case "string":
                            sampleData[field.name] = [`sample_${field.name}_item`];
                            break;
                        case "number":
                            sampleData[field.name] = [123];
                            break;
                        case "boolean":
                            sampleData[field.name] = [true];
                            break;
                        case "date":
                            sampleData[field.name] = [new Date().toISOString()];
                            break;
                        default:
                            sampleData[field.name] = [`sample_${field.name}_item`];
                    }
                } else {
                    sampleData[field.name] = [`sample_${field.name}_item`];
                }
                break;
            case "object":
                if (field.objectProperties?.length) {
                    sampleData[field.name] = generateSampleData(field.objectProperties);
                } else {
                    sampleData[field.name] = { key: "value" };
                }
                break;
            case "objectid":
            case "id":
                sampleData[field.name] = "507f1f77bcf86cd799439011";
                break;
            default:
                sampleData[field.name] = `sample_${field.name}`;
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