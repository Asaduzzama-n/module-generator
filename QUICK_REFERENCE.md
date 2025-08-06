# 🚀 Leo Generate - Quick Reference Card

## 📦 **Installation**
```bash
npm install -g @unknow69/leo-generator
```

## 🎯 **Essential Commands**

### **Generate Module**
```bash
# Basic
leo-generate generate User name:string email:string

# With alias
leo-generate g Product name:string price:number

# Legacy (still works)
leo-generate User name:string email:string
```

### **Update Documentation**
```bash
# Update all
leo-generate update-docs

# With alias
leo-generate docs

# Selective updates
leo-generate docs --no-postman    # Only Swagger
leo-generate docs --no-swagger    # Only Postman
```

## 🏗️ **Field Types**

| Type | Syntax | Example |
|------|--------|---------|
| **Basic** | `field:type` | `name:string`, `age:number`, `active:boolean` |
| **Required** | `field!:type` | `name!:string`, `email!:string` |
| **Optional** | `field?:type` | `bio?:string`, `avatar?:string` |
| **Enum** | `field:enum[val1,val2]` | `status:enum[active,inactive]` |
| **Reference** | `field:objectid:Model` | `author:objectid:User` |
| **Array** | `field:array:type` | `tags:array:string` |
| **Array Refs** | `field:array:objectid:Model` | `categories:array:objectid:Category` |

## 🔧 **Complex Structures**

### **Array of Objects**
```bash
items:array:object:name:string:price:number:quantity:number
```

### **Nested Objects**
```bash
address:object:street:string:city:string:zipCode:string
```

### **Combined Example**
```bash
leo-generate generate Order \
  customer:objectid:User \
  items:array:object:productId:objectid:Product:quantity:number:price:number \
  status:enum[pending,processing,shipped,delivered] \
  shippingAddress:object:street:string:city:string:zipCode:string \
  totalAmount!:number
```

## 📁 **Generated Files**

### **Module Files**
```
src/app/modules/{name}/
├── {name}.interface.ts    # TypeScript interfaces
├── {name}.model.ts       # Mongoose schema
├── {name}.controller.ts  # Express controllers
├── {name}.service.ts     # Business logic
├── {name}.route.ts       # Express routes
├── {name}.validation.ts  # Zod validation
└── {name}.constants.ts   # Constants
```

### **Documentation**
```
postman/{name}.postman_collection.json  # Postman collection
swagger.json                             # OpenAPI spec
```

## ⚙️ **Common Options**

| Option | Description | Example |
|--------|-------------|---------|
| `--no-postman` | Skip Postman generation | `leo-generate g User name:string --no-postman` |
| `--no-swagger` | Skip Swagger generation | `leo-generate g User name:string --no-swagger` |
| `--postman-dir <path>` | Custom Postman directory | `--postman-dir collections` |
| `--swagger-file <path>` | Custom Swagger file | `--swagger-file api-docs.json` |
| `--modules-dir <path>` | Custom modules directory | `--modules-dir src/modules` |

## 🎯 **Quick Examples**

### **User Management**
```bash
leo-generate g User \
  name!:string \
  email!:string \
  role:enum[admin,user,guest] \
  profile:object:firstName:string:lastName:string:phone:string \
  isActive:boolean
```

### **E-commerce Product**
```bash
leo-generate g Product \
  name!:string \
  price!:number \
  category:enum[Electronics,Clothing,Books] \
  variants:array:object:size:string:color:string:stock:number \
  tags:array:string \
  vendor:objectid:User
```

### **Blog Post**
```bash
leo-generate g Post \
  title!:string \
  content!:string \
  author:objectid:User \
  tags:array:string \
  status:enum[draft,published,archived] \
  publishedAt?:date
```

## 🔄 **Workflow**

### **Development Flow**
```bash
# 1. Generate module
leo-generate g User name:string email:string

# 2. Code changes made...

# 3. Update docs
leo-generate docs

# 4. Generate another module
leo-generate g Product name:string price:number

# 5. Update all docs
leo-generate docs
```

### **Team Workflow**
```bash
# Generate module with custom settings
leo-generate g Order \
  customer:objectid:User \
  items:array:object:name:string:price:number \
  --postman-dir team-collections \
  --swagger-file docs/api-spec.json

# Update team documentation
leo-generate docs \
  --postman-dir team-collections \
  --swagger-file docs/api-spec.json
```

## 📊 **Generated API Endpoints**

For module named "User":
```
POST   /api/v1/users      # Create user
GET    /api/v1/users      # Get all users (with pagination)
GET    /api/v1/users/:id  # Get single user
PATCH  /api/v1/users/:id  # Update user
DELETE /api/v1/users/:id  # Delete user
```

## 🎉 **Features Generated**

- ✅ **TypeScript interfaces** with nested types
- ✅ **Mongoose schemas** with validation
- ✅ **Express controllers** with pagination & search
- ✅ **Service layer** with error handling
- ✅ **Zod validation** schemas
- ✅ **RESTful routes** with middleware
- ✅ **Postman collections** ready for testing
- ✅ **Swagger documentation** (OpenAPI 3.0)
- ✅ **Auto-updated routes** file

## 🆘 **Help**
```bash
leo-generate --help
leo-generate generate --help
leo-generate update-docs --help
```

---
**Package**: `@unknow69/leo-generator` | **Version**: 1.1.0 | **CLI**: `leo-generate`