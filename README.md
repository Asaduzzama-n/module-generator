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
- 📮 Automatic Postman collection generation with dummy data

## Installation

```bash
npm install siuuu-module-generator --global
```

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

## Postman Collection Generation

There are two ways to integrate with Postman:

### 1. File-Based (Manual Import)

Generate Postman collections with proper endpoints and dummy data:

```bash
siuuu-create Product name:string price:number --postman
```

This creates a Postman collection file that you can manually import into Postman.

### 2. Direct API Integration (Automatic)

Automatically update your Postman collections without manual imports:

```bash
siuuu-create Product name:string price:number --postman-api-key YOUR_API_KEY --postman-collection YOUR_COLLECTION_ID
```

This directly updates your Postman collection via the Postman API.

#### Setting Up Postman API Integration

1. **Get your Postman API Key**:

   - Go to [Postman API Keys](https://go.postman.co/settings/me/api-keys)
   - Create a new API key with appropriate permissions

2. **Find your Collection ID**:

   - Open your collection in Postman
   - The collection ID is in the URL: `https://go.postman.co/workspace/xxx/collection/YOUR_COLLECTION_ID`

3. **Save your configuration for future use**:

   ```bash
   siuuu-create Product --postman-api-key YOUR_API_KEY --postman-collection YOUR_COLLECTION_ID --save-postman-config
   ```

4. **After saving configuration, you can simply use**:
   ```bash
   siuuu-create NewModule name:string description:string
   ```
   The module will be automatically added to your Postman collection.

#### Creating New Collections

To create a new collection in a workspace:

```bash
siuuu-create Product name:string price:number --postman-api-key YOUR_API_KEY --postman-workspace YOUR_WORKSPACE_ID
```
