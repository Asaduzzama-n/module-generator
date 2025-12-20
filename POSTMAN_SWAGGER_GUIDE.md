# 📮 Postman & Swagger Integration Guide

## 🎯 **How It Works - No API Keys Required!**

The generator automatically creates Postman collections and Swagger documentation for your modules. You can also automate the import process to Postman Cloud.

## Table of Contents
1. [Automatic Postman Sync (New)](#automatic-postman-sync-new)
2. [Postman Collections (Local)](#postman-collections-local)
3. [Swagger Documentation](#swagger-documentation)
4. [Updating Existing Modules](#updating-existing-modules)

## Automatic Postman Sync (New)

You can now automatically sync your module's API to an existing Postman collection in the cloud.

### 1. Setup

You need two pieces of information from Postman:
- **Postman API Key**: Generate one in your [Postman Account Settings](https://web.postman.co/settings/me/api-keys).
- **Collection ID**: Open your collection in Postman, click the "Info" icon (ⓘ) and copy the `ID`.

### 2. Configuration

You can provide these credentials in three ways:

#### A. Environment Variables (.env)
Create a `.env` file in your project root:
```env
POSTMAN_API_KEY=your_api_key_here
POSTMAN_COLLECTION_ID=your_collection_id_here
```

#### B. Package.json
Add them to your `moduleGenerator` config:
```json
"moduleGenerator": {
  "postmanApiKey": "your_api_key_here",
  "postmanCollectionId": "your_collection_id_here"
}
```

#### C. CLI Arguments
```bash
npx @unknow69/leo-generator generate User name:string --postman-api-key KEY --postman-collection-id ID
```

### 3. How it Works
When you generate a new module, the generator will:
1. Create the local Postman file as usual.
2. Connect to Postman API.
3. Fetch your collection.
4. Add or update a folder named `[ModuleName] API` within that collection.

## 📮 **Postman Collections**

### **What Gets Generated**
- Complete `.postman_collection.json` files for each module
- All CRUD operations (Create, Read, Update, Delete)
- Sample request bodies with realistic data
- Environment variables for easy configuration

### **How Users Use Them**

#### 1. **Import Collection into Postman**
```bash
# After generating a module
leo-generate generate User name:string email:string age:number

# Files created:
# postman/user.postman_collection.json ← Import this into Postman
```

#### 2. **Set Up Environment in Postman**
Users create a Postman environment with:
```json
{
  "base_url": "http://localhost:3000",
  "user_id": "507f1f77bcf86cd799439011"
}
```

#### 3. **Ready to Test!**
All requests are pre-configured:
- ✅ Correct HTTP methods (GET, POST, PATCH, DELETE)
- ✅ Proper headers (Content-Type: application/json)
- ✅ Sample request bodies
- ✅ Parameterized URLs with variables

### **Example Generated Postman Request**
```json
{
  "name": "Create User",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"age\": 25\n}"
    },
    "url": {
      "raw": "{{base_url}}/api/v1/users",
      "host": ["{{base_url}}"],
      "path": ["api", "v1", "users"]
    }
  }
}
```

## 📖 **Swagger Documentation**

### **What Gets Generated**
- Complete OpenAPI 3.0 specification (`swagger.json`)
- All endpoint documentation
- Request/response schemas
- Parameter definitions

### **How Users Use It**

#### 1. **View in Swagger UI**
Users can view the documentation using:

**Option A: Online Swagger Editor**
1. Go to https://editor.swagger.io/
2. Upload the generated `swagger.json` file
3. View interactive documentation

**Option B: Local Swagger UI**
```bash
# Install swagger-ui-serve
npm install -g swagger-ui-serve

# Serve the documentation
swagger-ui-serve swagger.json
# Opens at http://localhost:3000
```

**Option C: Integrate into Express App**
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

#### 2. **Generated Swagger Structure**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "API Documentation",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "post": {
        "tags": ["User"],
        "summary": "Create a new User",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserCreate"
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "_id": { "type": "string" },
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    }
  }
}
```

## 🔧 **User Workflow**

### **Step 1: Generate Module**
```bash
leo-generate generate Product name:string price:number category:enum[Electronics,Clothing]
```

### **Step 2: Files Created**
```
project/
├── src/app/modules/product/
│   ├── product.interface.ts
│   ├── product.model.ts
│   ├── product.controller.ts
│   └── ... (other files)
├── postman/
│   └── product.postman_collection.json  ← Import to Postman
└── swagger.json                         ← Use with Swagger UI
```

### **Step 3: Import & Configure**

**For Postman:**
1. Open Postman
2. Click "Import" → Select `postman/product.postman_collection.json`
3. Create environment with `base_url` variable
4. Start testing API endpoints

**For Swagger:**
1. Go to https://editor.swagger.io/
2. Upload `swagger.json`
3. View interactive documentation
4. Test endpoints directly in browser

## 🚀 **Advanced Features**

### **Complex Nested Structures**
```bash
leo-generate generate Order \
  customer:objectid:User \
  items:array:object:name:string:price:number:quantity:number \
  status:enum[pending,shipped,delivered]
```

**Generated Postman Sample:**
```json
{
  "customer": "507f1f77bcf86cd799439011",
  "items": [
    {
      "name": "Sample Product",
      "price": 29.99,
      "quantity": 2
    }
  ],
  "status": "pending"
}
```

**Generated Swagger Schema:**
```json
{
  "ItemsItem": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number" },
      "quantity": { "type": "number" }
    }
  },
  "Order": {
    "type": "object",
    "properties": {
      "customer": { "type": "string" },
      "items": {
        "type": "array",
        "items": { "$ref": "#/components/schemas/ItemsItem" }
      },
      "status": {
        "type": "string",
        "enum": ["pending", "shipped", "delivered"]
      }
    }
  }
}
```

## 🔄 **Bulk Documentation Updates**

Update documentation for all existing modules:
```bash
leo-generate update-docs
```

This scans all modules and regenerates:
- All Postman collections
- Updated Swagger documentation

## 🎯 **Benefits for Users**

### **For Developers:**
- ✅ **Instant API Testing** - Import and test immediately
- ✅ **No Manual Setup** - All requests pre-configured
- ✅ **Realistic Sample Data** - Based on actual field types
- ✅ **Environment Ready** - Easy to switch between dev/staging/prod

### **For Teams:**
- ✅ **Consistent Documentation** - Same format across all APIs
- ✅ **Always Up-to-Date** - Regenerated with code changes
- ✅ **Interactive Testing** - Swagger UI for live testing
- ✅ **Easy Sharing** - JSON files can be version controlled

### **For Projects:**
- ✅ **Professional Documentation** - OpenAPI 3.0 standard
- ✅ **Client SDK Generation** - Use Swagger Codegen
- ✅ **API Validation** - Ensure consistency
- ✅ **Onboarding** - New developers can test APIs immediately

## 🔐 **Security & Authentication**

The generated collections include placeholders for authentication:

```json
{
  "header": [
    {
      "key": "Authorization",
      "value": "Bearer {{auth_token}}",
      "disabled": true
    },
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ]
}
```

Users can:
1. Enable auth headers as needed
2. Set up auth tokens in environment variables
3. Configure API keys, JWT tokens, etc.

## 📊 **No External Dependencies**

- ❌ **No API keys required** for generation
- ❌ **No external services** needed
- ❌ **No internet connection** required for generation
- ✅ **Pure static file generation**
- ✅ **Works offline**
- ✅ **Version controllable**

The tool generates standard JSON files that work with any Postman installation and any Swagger UI implementation!