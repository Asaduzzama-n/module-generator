# LEO Module Generator Update

Based on the recent changes I've observed in your codebase, I'll update the README to reflect the current state of the project. Here's the updated README:

````markdown:d:\module-generator\README.md
# LEO Module Generator

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
npm install leo-module-generator --global
````

Or use with npx:

```bash
npx leo-module-generator
```

## Quick Start

Generate a basic module:

```bash
leo-create User name:string email:string age:number
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
leo-create User --modules-dir src/modules --routes-file src/routes.ts
```

## Examples

### Basic CRUD Module

```bash
leo-create Product name!:string price!:number description?:string
```

### With References

```bash
leo-create Order user:objectid:User products:array:objectid:Product
```

## API Endpoints

For a module named "Product":

```
POST   /api/v1/products      - Create product
GET    /api/v1/products      - Get all products
GET    /api/v1/products/:id  - Get single product
PATCH  /api/v1/products/:id  - Update product
DELETE /api/v1/products/:id  - Delete product
```

## Common Patterns

### File Upload Module

```bash
leo-create Media title:string description:string file:string type:string
```

## Postman Collection Generation

### 1. File-Based (Manual Import)

Generate Postman collections with proper endpoints and dummy data:

```bash
leo-create Product name:string price:number --postman
```

This creates a Postman collection file that you can manually import into Postman.

### 2. Direct API Integration (Automatic)

#### Setting Up Postman API Integration

1. **Get your Postman API Key**:

   - Go to [Postman API Keys](https://go.postman.co/settings/me/api-keys)
   - Create a new API key with appropriate permissions

2. **Find your Collection ID**:

   - Open your collection in Postman
   - The collection ID is in the URL: `https://go.postman.co/workspace/xxx/collection/YOUR_COLLECTION_ID`

3. **Save your configuration for future use**:

   ```bash
   leo-create Product --postman-api-key YOUR_API_KEY --postman-collection YOUR_COLLECTION_ID --save-postman-config
   ```

4. **After saving configuration, you can simply use**:
   ```bash
   leo-create NewModule name:string description:string
   ```
   The module will be automatically added to your Postman collection.

#### Creating New Collections

To create a new collection in a workspace:

```bash
leo-create Product name:string price:number --postman-api-key YOUR_API_KEY --postman-workspace YOUR_WORKSPACE_ID
```

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.
