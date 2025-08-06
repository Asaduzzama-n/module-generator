# Leo Generate - Enhanced Module Generator

A powerful and comprehensive module generator for Express.js applications with Mongoose models, automatic Postman collections, and Swagger documentation.

## 🚀 Features

### Core Module Generation
- 📁 Complete folder structure with TypeScript support
- 🧩 Advanced TypeScript interfaces with nested types
- 🔄 Mongoose models with complex schema support
- 🎮 Production-ready Express controllers with pagination
- 🛠️ Enhanced service layer with error handling
- 🛣️ RESTful routes with validation middleware
- ✅ Zod validation with nested object support
- 🎨 Clean and consistent code structure

### Advanced Field Support
- 🔣 Enum fields with predefined values
- 🏗️ Complex nested objects and arrays
- 📊 Array of objects with defined structures
- 🔗 ObjectId references with auto-population
- 📁 File upload handling
- 🔍 Search and pagination support

### Smart Documentation Generation
- 📮 **Automatic Postman Collections** - Generate complete API collections
- 📖 **Swagger Documentation** - Auto-generate OpenAPI 3.0 specs
- 🔄 **Intelligent Documentation Updates** - Analyzes your code changes and updates docs accordingly
- 🧠 **Code-Aware Parsing** - Reads both interface and model files for accurate field extraction
- 📂 **Organized Output** - Separate folders for different documentation types
- ✅ **100% Syntax Support** - Handles ALL field types the generator can create

## 📦 Installation

```bash
npm install leo-generate --global
```

Or use with npx:

```bash
npx leo-generate
```

## 🎯 Quick Start

### Basic Module Generation

```bash
# Primary command (recommended)
leo-generate generate User name:string email:string age:number

# Short alias
leo-generate g User name:string email:string

# Legacy support (still works)
leo-generate User name:string email:string age:number
```

## 📋 **Quick Command Reference**

| Command | Purpose | Example |
|---------|---------|---------|
| `generate <name> [fields...]` | Create new module | `leo-generate generate User name:string email:string` |
| `g <name> [fields...]` | Short alias for generate | `leo-generate g Product name:string price:number` |
| `update-docs` | Update all documentation | `leo-generate update-docs` |
| `docs` | Short alias for update-docs | `leo-generate docs` |
| `<name> [fields...]` | Legacy syntax | `leo-generate User name:string email:string` |

### **Common Options**
- `--no-postman` - Skip Postman collection generation
- `--no-swagger` - Skip Swagger documentation generation  
- `--postman-dir <path>` - Custom Postman output directory
- `--swagger-file <path>` - Custom Swagger file path
- `--modules-dir <path>` - Custom modules directory

This creates:

```
src/app/modules/user/
├── user.interface.ts   // Enhanced TypeScript interfaces
├── user.model.ts      // Mongoose model with validation
├── user.controller.ts // Production-ready controllers
├── user.service.ts    // Enhanced service layer
├── user.route.ts      // RESTful routes
├── user.validation.ts // Zod validation schemas
└── user.constants.ts  // Constants

postman/
└── user.postman_collection.json  // Auto-generated Postman collection

swagger.json  // Updated with new endpoints
```

## 🛠️ Commands

### Generate Module
```bash
leo-generate generate <ModuleName> [fields...]

# Options:
--no-postman          # Skip Postman collection generation
--no-swagger          # Skip Swagger documentation
--postman-dir <path>  # Custom Postman output directory
--swagger-file <path> # Custom Swagger file path
--modules-dir <path>  # Custom modules directory
--routes-file <path>  # Custom routes file
```

### Smart Documentation Updates
```bash
# Intelligently updates documentation for all existing modules
leo-generate update-docs

# Aliases:
leo-generate docs

# The system automatically:
# ✅ Scans all modules in your project
# ✅ Reads both interface and model files  
# ✅ Extracts current field definitions
# ✅ Generates accurate Postman collections
# ✅ Updates Swagger documentation
# ✅ Handles complex nested structures
# ✅ Preserves enum values and references

# Options:
--modules-dir <path>  # Path to modules directory
--no-postman          # Skip Postman updates
--no-swagger          # Skip Swagger updates
--postman-dir <path>  # Custom Postman output directory
--swagger-file <path> # Custom Swagger file path
```

## 🏗️ Advanced Examples

### Complex Nested Structures

```bash
# E-commerce Order with nested items
leo-generate generate Order \
  customer:objectid:User \
  items:array:object:name:string:price:number:quantity:number \
  status:enum[pending,processing,shipped,delivered] \
  shippingAddress:object:street:string:city:string:zipCode:string \
  totalAmount:number \
  createdAt:date
```

### Blog System with References

```bash
# Blog post with author reference and tags
leo-generate generate Post \
  title!:string \
  content!:string \
  author:objectid:User \
  tags:array:string \
  status:enum[draft,published,archived] \
  publishedAt?:date \
  viewCount:number
```

### Product Catalog with Variants

```bash
# Product with multiple variants
leo-generate generate Product \
  name!:string \
  description:string \
  category:enum[Electronics,Clothing,Books,Home] \
  variants:array:object:size:string:color:string:price:number:stock:number \
  images:array:string \
  isActive:boolean
```

## 📋 Field Types & Syntax

### Basic Types
```bash
name:string          # String field
age:number           # Number field
isActive:boolean     # Boolean field
createdAt:date       # Date field
```

### Modifiers
```bash
name!:string         # Required field
email?:string        # Optional field
```

### Enums
```bash
status:enum[active,inactive,pending]
role:enum[admin,user,moderator]
```

### References
```bash
author:objectid:User              # Single reference
categories:array:objectid:Category # Array of references
```

### Complex Structures
```bash
# Array of objects
items:array:object:name:string:price:number:quantity:number

# Nested object
address:object:street:string:city:string:country:string

# Mixed arrays
tags:array:string
scores:array:number
```

## 🎮 Generated API Features

### Enhanced Controllers
- ✅ Pagination support with meta information
- 🔍 Search functionality across string fields
- 📊 Sorting with customizable fields
- 🛡️ Input validation and sanitization
- 📁 File upload handling
- ⚡ Error handling with proper HTTP status codes

### Production-Ready Services
- 🔒 ObjectId validation
- 🔄 Auto-population of references
- 🗑️ Proper file cleanup on deletion
- 📈 Optimized queries with lean()
- 🔍 Advanced search with regex
- 📊 Aggregation support

### API Endpoints
For a module named "Product":

```
POST   /api/v1/products              # Create product
GET    /api/v1/products              # Get all (with pagination, search, sort)
GET    /api/v1/products/:id          # Get single product
PATCH  /api/v1/products/:id          # Update product
DELETE /api/v1/products/:id          # Delete product

Query Parameters for GET /api/v1/products:
?page=1&limit=10&search=keyword&sortBy=createdAt&sortOrder=desc
```

## 📮 Postman Integration

### Auto-Generated Collections
- 🔄 Complete CRUD operations
- 📝 Sample request bodies with realistic data
- 🔗 Environment variables for base URL
- 📊 Proper HTTP methods and headers
- 🎯 Parameter examples for all endpoints

### Collection Structure
```json
{
  "info": {
    "name": "Product API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Product",
      "request": {
        "method": "POST",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"sample_name\",\n  \"price\": 123\n}"
        }
      }
    }
  ]
}
```

## 📖 Swagger Integration

### Auto-Generated Documentation
- 📋 OpenAPI 3.0 specification
- 🏷️ Proper tags and descriptions
- 📝 Request/response schemas
- 🔍 Parameter documentation
- ✅ Validation rules included
- 🔄 Automatic updates on module changes

### Schema Generation
```yaml
components:
  schemas:
    Product:
      type: object
      properties:
        _id:
          type: string
          description: MongoDB ObjectId
        name:
          type: string
          description: name field
        price:
          type: number
          description: price field
        createdAt:
          type: string
          format: date-time
      required:
        - _id
        - name
```

## ⚙️ Configuration

### Via package.json
```json
{
  "moduleGenerator": {
    "modulesDir": "src/app/modules",
    "routesFile": "src/routes/index.ts"
  }
}
```

### Via CLI Options
```bash
leo-generate generate User name:string \
  --modules-dir src/modules \
  --routes-file src/routes.ts \
  --postman-dir collections \
  --swagger-file api-docs.json
```

## 🧠 Enhanced Documentation Intelligence (v1.2.0)

### **Code-Aware Documentation Updates**
The enhanced system now intelligently analyzes your code changes:

```bash
# Example: You modify an Order model
# BEFORE: items had name, price, quantity
# AFTER: items only have name (removed price, quantity)

# Simply run:
leo-generate update-docs

# The system will:
# ✅ Read your modified interface and model files
# ✅ Detect that items now only have 'name' field
# ✅ Update Postman collections: {"items": [{"name": "sample_name"}]}
# ✅ Update Swagger schemas to reflect current structure
# ✅ Handle ALL field types: enums, arrays, nested objects, references
```

### **100% Syntax Support**
Every field type the generator can create is fully supported in updates:

| Syntax | Generated Sample | Update Support |
|--------|------------------|----------------|
| `name:string` | `"name": "sample_name"` | ✅ Perfect |
| `age:number` | `"age": 123` | ✅ Perfect |
| `tags:array:string` | `"tags": ["sample_item"]` | ✅ Perfect |
| `scores:array:number` | `"scores": [123]` | ✅ Perfect |
| `status:enum[active,inactive]` | `"status": "active"` | ✅ Perfect |
| `author:objectid:User` | `"author": "507f1f77..."` | ✅ Perfect |
| `items:array:object:name:string:price:number` | `"items": [{"name": "...", "price": 123}]` | ✅ Perfect |

## 🔄 Migration from v1.1

The new version maintains backward compatibility:

```bash
# Old way (still works)
leo-generate User name:string email:string

# New way (recommended)
leo-generate generate User name:string email:string

# Enhanced documentation updates
leo-generate update-docs
```

## 🎯 Best Practices

### Module Design
1. Use singular names for modules (e.g., "User" not "Users")
2. Mark required fields with "!" suffix
3. Use descriptive field names
4. Group related fields logically
5. Consider using enums for status fields

### Field Naming
```bash
# Good
leo-generate generate User name!:string email!:string status:enum[active,inactive]

# Avoid
leo-generate generate Users NAME:string Email:string stat:string
```

### Complex Structures
```bash
# Prefer structured objects over loose data
leo-generate generate Order \
  items:array:object:productId:objectid:Product:quantity:number:price:number \
  # Instead of: items:array:string
```

## 🚀 Performance Features

### Optimized Queries
- 📊 Lean queries for list operations
- 🔍 Indexed search fields
- 📈 Aggregation pipeline support
- 🔄 Efficient population of references

### Caching Ready
- 🏪 Service layer designed for caching integration
- 🔑 Consistent data access patterns
- ⚡ Optimized for Redis integration

## 🛡️ Security Features

### Input Validation
- ✅ Zod schema validation
- 🛡️ XSS protection ready
- 📝 Sanitized inputs
- 🔒 Type-safe operations

### File Upload Security
- 📁 Proper file type validation
- 🗑️ Automatic cleanup on errors
- 📊 Size limit enforcement ready

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
git clone <repository>
cd leo-generator
npm install
npm run build
```

## 📄 License

MIT

---

**Leo Generate** - Because generating quality code should be as smooth as Leo's dribbling! ⚽
