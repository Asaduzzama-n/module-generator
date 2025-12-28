// Filterable fields for Testmodule
export const testmoduleFilterables = ['name', 'email'];

// Searchable fields for Testmodule
export const testmoduleSearchableFields = ['name', 'email'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};