# Express Module Generator

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

## Installation

```bash
npm install express-module-generator --global
```

Or use with npx:

```bash
npx express-module-generator
```

## Quick Start

Generate a basic module:

```bash
create-module User name:string email:string age:number
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
create-module User --modules-dir src/modules --routes-file src/routes.ts
```

## Field Types

### Basic Types

- `string` - Text fields
- `number` - Numeric fields
- `boolean` - Boolean fields
- `date` - Date fields
- `objectid` - MongoDB ObjectId

### Advanced Types

- `array` - Array fields
- `object` - Nested objects

### Modifiers

- Required: `fieldName!:type`
- Optional: `fieldName?:type`
- Reference: `fieldName:objectid:ModelName`

## Examples

### Basic CRUD Module

```bash
create-module Product name!:string price!:number description?:string
```

### With File Uploads

```bash
create-module Profile name:string avatar:string photos:array:string
```

### With References

```bash
create-module Order user:objectid:User products:array:objectid:Product
```

### Complex Nested Structure

```bash
create-module Survey title:string questions:array:object:text:string:options:array:string
```

### Skip Specific Files

```bash
create-module User name:string --skip validation constants
```

## Generated Code Features

### Controllers

- Full CRUD operations
- File upload handling
- Proper error handling
- Response formatting

### Services

- Database operations
- File management
- Business logic separation
- Type-safe operations

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

## Common Patterns

### File Upload Module

```bash
create-module Media title:string description:string file:string type:string
```

### Parent-Child Relationship

```bash
create-module Comment text:string post:objectid:Post user:objectid:User
```

### Nested Data Structure

```bash
create-module Form fields:array:object:label:string:type:string:required:boolean
```

## Error Handling

The generator includes built-in error handling for:

- Database operations
- File uploads
- Validation errors
- Not found errors
- Authorization errors

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

MIT

```

This README now provides:
1. Clear feature overview
2. Detailed usage examples
3. Configuration options
4. Field type documentation
5. Generated code explanation
6. Common patterns and best practices
7. Error handling information
```
