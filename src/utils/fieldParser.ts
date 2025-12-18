import { FieldDefinition } from "../types";

export function parseFieldDefinitions(args: string[]): {
  fields: FieldDefinition[];
  skipFiles: string[];
  hasFile: boolean;
} {
  const fields: FieldDefinition[] = [];
  const skipFiles: string[] = [];
  let skipMode = false;
  let hasFile = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--skip") {
      skipMode = true;
      continue;
    }

    if (arg === "--file:true" || arg === "file:true") {
      hasFile = true;
      continue;
    }

    if (skipMode) {
      skipFiles.push(arg);
    } else {
      try {
        // Check if the argument contains enum values
        const enumMatch = arg.match(/^([a-zA-Z0-9_]+(?:\?|!)?)\[([^\]]+)\]$/);
        if (enumMatch) {
          // This is an enum field with values in square brackets
          let [, name, enumValues] = enumMatch;
          const enumOptions = enumValues.split(",").map((v) => v.trim());

          // Check for optional marker (?)
          const isOptional = name.endsWith("?");
          if (isOptional) {
            name = name.slice(0, -1);
          }

          // Check for required marker (!)
          const isRequired = name.endsWith("!");
          if (isRequired) {
            name = name.slice(0, -1);
          }

          fields.push({
            name,
            type: "enum",
            enumValues: enumOptions,
            isRequired,
            isOptional,
          });

          console.log(
            `Added enum field: ${name} with values [${enumOptions.join(", ")}]`
          );
        } else {
          // Process as field definition
          const parts = arg.split(":");

          if (parts.length >= 2) {
            let name = parts[0].trim();
            const typeRaw = parts[1].trim(); // Don't lowercase yet to preserve enum values if any
            let type = typeRaw.toLowerCase();

            // Check if type follows enum[a,b] pattern
            const typeEnumMatch = typeRaw.match(/^enum\[([^\]]+)\]$/i);
            if (typeEnumMatch) {
              const enumValues = typeEnumMatch[1].split(",").map((v) => v.trim());

              // Check for optional marker (?)
              const isOptional = name.endsWith("?");
              if (isOptional) {
                name = name.slice(0, -1);
              }

              // Check for required marker (!)
              const isRequired = name.endsWith("!");
              if (isRequired) {
                name = name.slice(0, -1);
              }

              fields.push({
                name,
                type: "enum",
                enumValues,
                isRequired,
                isOptional,
              });

              console.log(
                `Added enum field: ${name} with values [${enumValues.join(", ")}]`
              );
              continue;
            }

            // Skip _id field as it's automatically handled by MongoDB
            if (name.toLowerCase() === "_id") {
              continue;
            }

            // Check for optional marker (?)
            const isOptional = name.endsWith("?");
            if (isOptional) {
              name = name.slice(0, -1);
            }

            // Check for required marker (!)
            const isRequired = name.endsWith("!");
            if (isRequired) {
              name = name.slice(0, -1);
            }

            // Handle array of objects with properties
            if (
              type === "array" &&
              parts.length > 2 &&
              parts[2].toLowerCase() === "object"
            ) {
              console.log(`Processing array of objects field: ${name}`);

              const objectProperties = [];

              for (let j = 3; j < parts.length; j += 2) {
                if (j + 1 < parts.length) {
                  let propName = parts[j];
                  const propType = parts[j + 1];

                  console.log(`  Property: ${propName}:${propType}`);

                  const propIsOptional = propName.endsWith("?");
                  const propIsRequired = propName.endsWith("!");

                  if (propIsOptional) {
                    propName = propName.slice(0, -1);
                  }
                  if (propIsRequired) {
                    propName = propName.slice(0, -1);
                  }

                  objectProperties.push({
                    name: propName,
                    type: propType,
                    isOptional: propIsOptional,
                    isRequired: propIsRequired,
                  });
                }
              }

              fields.push({
                name,
                type,
                ref: "object",
                isRequired,
                isOptional,
                objectProperties,
              });

              console.log(
                `Added field with ${objectProperties.length} properties`
              );
            } else if (type === "array" && parts.length > 2) {
              // Handle array of references (e.g., products:array:objectid:Product)
              const arrayItemType = parts[2].toLowerCase();
              let ref = parts.length > 3 ? parts[3].trim() : undefined;

              fields.push({
                name,
                type,
                arrayItemType,
                ref,
                isRequired,
                isOptional,
              });

              console.log(
                `Added array field: ${name}:${type}:${arrayItemType}${ref ? `:${ref}` : ""
                }`
              );
            } else {
              // Regular field
              const ref = parts.length > 2 ? parts[2].trim() : undefined;
              fields.push({ name, type, ref, isRequired, isOptional });
              console.log(
                `Added regular field: ${name}:${type}${ref ? `:${ref}` : ""}`
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing field definition: ${arg}`, error);
      }
    }
  }

  console.log("Parsed fields:", JSON.stringify(fields, null, 2));
  if (hasFile) console.log("📂 File upload support enabled");
  return { fields, skipFiles, hasFile };
}
