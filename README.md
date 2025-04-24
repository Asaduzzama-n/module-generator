# Adding Enum Support to SIUUU Module Generator

I see that the enum feature for field definitions isn't working correctly. Let's update the README to include documentation for this feature and explain how to use it properly.

## Adding Enum Documentation to README

Let's add a new example section to the README that specifically covers enum fields:

````markdown:d:\module-generator\README.md
# SIUUU Module Generator

A powerful CLI tool for generating Express.js + Mongoose modules with TypeScript support. Quickly scaffold complete CRUD modules with proper type definitions, validation, and file handling.

## Features

- 🚀 Generate complete module structure with a single command
- 📝 TypeScript-first approach with proper type definitions
- 🔄 Automatic CRUD operations with proper error handling
- 🔍 Built-in Zod validation schema generation
- 📁 Smart file upload handling for image and media fields
- 🔗 Automatic route registration in central router
- 🎯 Support for complex data structures (nested objects, arrays)
- ⚙️ Highly configurable via package.json or CLI options
- 🛡️ Built-in request validation middleware
- 🎨 Clean and consistent code structure
- 🔣 Support for enum fields with predefined values

## Installation

```bash
npm install siuuu-module-generator --global
````

Or use with npx:

```bash
npx siuuu-module-generator
```

## Quick Start

Generate a basic module:

```bash
siuuu-create User name:string email:string age:number
```

This creates:

```
src/app/modules/user/
├── user.interface.ts   // TypeScript interfaces
├── user.model.ts      // Mongoose model
├── user.controller.ts // CRUD controllers
├── user.service.ts    // Business logic
├── user.route.ts      // Express routes
├── user.validation.ts // Zod validation
└── user.constants.ts  // Constants
```

## Configuration

### Via package.json

```json
{
  "moduleGenerator": {
    "modulesDir": "src/app/modules",
    "routesFile": "src/routes/index.ts"
  }
}
```

### Via CLI

```bash
siuuu-create User --modules-dir src/modules --routes-file src/routes.ts
```

## Examples

### Basic CRUD Module

```bash
siuuu-create Product name!:string price!:number description?:string
```

### With File Uploads

```bash
siuuu-create Profile name:string avatar:string photos:array:string
```

### With References

```bash
siuuu-create Order user:objectid:User products:array:objectid:Product
```

### With Enum Values

```bash
siuuu-create Category label:enum[CII,CAA,OTHER] status:enum[ACTIVE,INACTIVE]
```

This creates a module with enum fields that are restricted to the specified values in both the interface and model.

### Complex Nested Structure

```bash
siuuu-create Survey title:string questions:array:object:text:string:options:array:string
```

### Skip Specific Files

```bash
siuuu-create User name:string --skip validation constants
```

## Generated Code Features

### Controllers

- Full CRUD operations
- File upload handling
- Proper error handling
- Response formatting

### Routes

- RESTful endpoints
- Validation middleware
- File upload middleware
- Authentication hooks

### Validation

- Request body validation
- Type checking
- Custom error messages
- Required/optional fields

## API Endpoints

For a module named "Product":

```
POST   /api/v1/products      - Create product
GET    /api/v1/products      - Get all products
GET    /api/v1/products/:id  - Get single product
PATCH  /api/v1/products/:id  - Update product
DELETE /api/v1/products/:id  - Delete product
```

## Best Practices

1. Use singular names for modules (e.g., "User" not "Users")
2. Mark required fields with "!"
3. Use descriptive field names
4. Follow naming conventions for file fields (image, file, media)
5. For enum fields, use the format `fieldname:enum[VALUE1,VALUE2,VALUE3]`

## Common Patterns

### File Upload Module

```bash
siuuu-create Media title:string description:string file:string type:string
```

### Enum Field Module

```bash
siuuu-create Role name:string permission:enum[READ,WRITE,ADMIN]
```

### Nested Data Structure

```bash
siuuu-create Form fields:array:object:label:string:type:string:required:boolean
```

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

MIT
