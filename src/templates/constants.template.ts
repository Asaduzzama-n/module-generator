import { FieldDefinition } from "../types";

const generateConstantsContent = (
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[]
): string => {
  // Generate filterable fields (string and enum types)
  const filterableFields = fields.filter(
    f => f.type.toLowerCase() === "string" || f.type.toLowerCase() === "enum"
  );

  // Generate searchable fields (string types only)
  const searchableFields = fields.filter(
    f => f.type.toLowerCase() === "string"
  );

  return `// Filterable fields for ${camelCaseName}
export const ${folderName}Filterables = [${filterableFields.map(f => `'${f.name}'`).join(', ')}];

// Searchable fields for ${camelCaseName}
export const ${folderName}SearchableFields = [${searchableFields.map(f => `'${f.name}'`).join(', ')}];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};`;
};

export { generateConstantsContent };