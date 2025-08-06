# 📚 Leo Generate - Complete Command Reference

## 🚀 **Package Information**
- **Package Name**: `@unknow69/leo-generator`
- **Version**: `1.1.0`
- **Binary**: `leo-generate`

## 📋 **All Available Commands**

### **1. Module Generation Commands**

#### **Primary Command: `generate` (Recommended)**
```bash
leo-generate generate <ModuleName> [field1:type] [field2:type] [...options]
```

**Alias**: `g`
```bash
leo-generate g <ModuleName> [field1:type] [field2:type] [...options]
```

**Examples**:
```bash
# Basic module
leo-generate generate User name:string email:string age:number

# With alias
leo-generate g Product name:string price:number

# Complex nested structures
leo-generate generate Order \
  customer:objectid:User \
  items:array:object:name:string:price:number:quantity:number \
  status:enum[pending,processing,shipped,delivered] \
  shippingAddress:object:street:string:city:string:zipCode:string \
  totalAmount:number

# With required fields
leo-generate generate User name!:string email!:string age:number

# With optional fields
leo-generate generate Post title:string content:string author?:string
```

#### **Legacy Command (Backward Compatibility)**
```bash
leo-generate <ModuleName> [field1:type] [field2:type] [...options]
```

**Examples**:
```bash
# Legacy syntax (still works)
leo-generate User name:string email:string age:number
leo-generate Product name:string price:number category:enum[Electronics,Clothing]
```

### **2. Documentation Update Commands**

#### **Update All Documentation**
```bash
leo-generate update-docs [options]
```

**Alias**: `docs`
```bash
leo-generate docs [options]
```

**Examples**:
```bash
# Update both Postman and Swagger for all modules
leo-generate update-docs

# Using alias
leo-generate docs

# Update only Postman collections
leo-generate update-docs --no-swagger

# Update only Swagger documentation
leo-generate update-docs --no-postman

# Custom directories
leo-generate update-docs \
  --modules-dir src/modules \
  --postman-dir api-collections \
  --swagger-file docs/api-spec.json
```

### **3. Help and Version Commands**

#### **Help**
```bash
leo-generate --help
leo-generate generate --help
leo-generate update-docs --help
```

#### **Version**
```bash
leo-generate --version
```

## ⚙️ **Command Options**

### **Generate Command Options**

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `-c, --config <path>` | Path to custom config file | - | `--config ./custom-config.json` |
| `--modules-dir <path>` | Path to modules directory | `src/app/modules` | `--modules-dir src/modules` |
| `--routes-file <path>` | Path to routes file | `src/routes/index.ts` | `--routes-file src/routes.ts` |
| `--no-postman` | Skip Postman collection generation | false | `--no-postman` |
| `--no-swagger` | Skip Swagger documentation generation | false | `--no-swagger` |
| `--postman-dir <path>` | Custom Postman output directory | `postman` | `--postman-dir collections` |
| `--swagger-file <path>` | Custom Swagger file path | `swagger.json` | `--swagger-file api-docs.json` |

### **Update-Docs Command Options**

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--modules-dir <path>` | Path to modules directory | `src/app/modules` | `--modules-dir src/modules` |
| `--no-postman` | Skip Postman collection generation | false | `--no-postman` |
| `--no-swagger` | Skip Swagger documentation generation | false | `--no-swagger` |
| `--postman-dir <path>` | Custom Postman output directory | `postman` | `--postman-dir collections` |
| `--swagger-file <path>` | Custom Swagger file path | `swagger.json` | `--swagger-file api-spec.json` |

## 🏗️ **Field Type Syntax**

### **Basic Types**
```bash
name:string          # String field
age:number           # Number field
isActive:boolean     # Boolean field
createdAt:date       # Date field
```

### **Field Modifiers**
```bash
name!:string         # Required field (!)
email?:string        # Optional field (?)
```

### **Enum Fields**
```bash
status:enum[active,inactive,pending]
role:enum[admin,user,moderator]
category:enum[Electronics,Clothing,Books,Home]
```

### **Reference Fields**
```bash
author:objectid:User              # Single ObjectId reference
categories:array:objectid:Category # Array of ObjectId references
```

### **Complex Nested Structures**

#### **Array of Objects**
```bash
items:array:object:name:string:price:number:quantity:number
variants:array:object:size:string:color:string:stock:number
```

#### **Nested Objects**
```bash
address:object:street:string:city:string:country:string:zipCode:string
profile:object:firstName:string:lastName:string:bio:string
```

#### **Mixed Arrays**
```bash
tags:array:string           # Array of strings
scores:array:number         # Array of numbers
flags:array:boolean         # Array of booleans
```

## 📁 **Generated File Structure**

### **Module Files Created**
```
src/app/modules/{modulename}/
├── {modulename}.interface.ts    # TypeScript interfaces
├── {modulename}.model.ts       # Mongoose schema
├── {modulename}.controller.ts  # Express controllers
├── {modulename}.service.ts     # Business logic
├── {modulename}.route.ts       # Express routes
├── {modulename}.validation.ts  # Zod validation
└── {modulename}.constants.ts   # Constants
```

### **Documentation Files Created**
```
postman/
└── {modulename}.postman_collection.json  # Postman collection

swagger.json                               # OpenAPI 3.0 specification
```

### **Updated Files**
```
src/routes/index.ts                        # Auto-updated with new routes
```

## 🎯 **Complete Usage Examples**

### **E-commerce System**

#### **User Module**
```bash
leo-generate generate User \
  name!:string \
  email!:string \
  password!:string \
  role:enum[admin,user,customer] \
  profile:object:firstName:string:lastName:string:phone:string \
  isActive:boolean \
  lastLogin?:date
```

#### **Product Module**
```bash
leo-generate generate Product \
  name!:string \
  description:string \
  price!:number \
  category:enum[Electronics,Clothing,Books,Home] \
  variants:array:object:size:string:color:string:price:number:stock:number \
  images:array:string \
  tags:array:string \
  isActive:boolean \
  vendor:objectid:User
```

#### **Order Module**
```bash
leo-generate generate Order \
  customer:objectid:User \
  items:array:object:productId:objectid:Product:quantity:number:price:number \
  status:enum[pending,processing,shipped,delivered,cancelled] \
  shippingAddress:object:street:string:city:string:state:string:zipCode:string:country:string \
  billingAddress:object:street:string:city:string:state:string:zipCode:string:country:string \
  totalAmount!:number \
  paymentStatus:enum[pending,paid,failed,refunded] \
  orderDate:date \
  deliveryDate?:date
```

### **Blog System**

#### **Post Module**
```bash
leo-generate generate Post \
  title!:string \
  content!:string \
  excerpt:string \
  author:objectid:User \
  category:objectid:Category \
  tags:array:string \
  status:enum[draft,published,archived] \
  publishedAt?:date \
  viewCount:number \
  likes:array:objectid:User \
  comments:array:object:author:objectid:User:content:string:createdAt:date
```

#### **Category Module**
```bash
leo-generate generate Category \
  name!:string \
  slug!:string \
  description:string \
  parent?:objectid:Category \
  isActive:boolean
```

### **File Upload Module**
```bash
leo-generate generate Media \
  title:string \
  description:string \
  filename!:string \
  originalName:string \
  mimeType:string \
  size:number \
  path:string \
  uploadedBy:objectid:User \
  isPublic:boolean
```

## 🔄 **Workflow Commands**

### **Development Workflow**
```bash
# 1. Generate new module
leo-generate generate User name:string email:string

# 2. Update documentation after code changes
leo-generate update-docs

# 3. Generate another module
leo-generate generate Product name:string price:number

# 4. Update all documentation
leo-generate docs
```

### **Team Workflow**
```bash
# Team member 1: Creates user module
leo-generate generate User name:string email:string role:enum[admin,user]

# Team member 2: Creates product module
leo-generate generate Product name:string price:number category:string

# Team lead: Updates all documentation
leo-generate update-docs --postman-dir team-collections
```

### **CI/CD Integration**
```bash
# In CI/CD pipeline
leo-generate update-docs --no-postman  # Only update Swagger for API docs
```

## 🛠️ **Configuration Options**

### **Via package.json**
```json
{
  "moduleGenerator": {
    "modulesDir": "src/app/modules",
    "routesFile": "src/routes/index.ts"
  }
}
```

### **Via CLI Options**
```bash
leo-generate generate User name:string \
  --modules-dir src/modules \
  --routes-file src/routes.ts \
  --postman-dir collections \
  --swagger-file docs/api.json
```

## 🚨 **Skip File Generation**

### **Skip Specific Files**
```bash
# Skip specific file types during generation
leo-generate generate User name:string email:string --skip controller service
```

### **Skip Documentation**
```bash
# Skip Postman collection generation
leo-generate generate User name:string --no-postman

# Skip Swagger documentation generation
leo-generate generate User name:string --no-swagger

# Skip both
leo-generate generate User name:string --no-postman --no-swagger
```

## 📊 **Command Summary**

| Command | Purpose | Output |
|---------|---------|--------|
| `generate <name> [fields...]` | Create new module with documentation | Module files + Postman + Swagger |
| `g <name> [fields...]` | Alias for generate | Same as generate |
| `<name> [fields...]` | Legacy syntax | Same as generate |
| `update-docs` | Update all module documentation | Updated Postman + Swagger |
| `docs` | Alias for update-docs | Same as update-docs |
| `--help` | Show help information | Help text |
| `--version` | Show version information | Version number |

## 🎉 **Quick Start Commands**

```bash
# Install globally
npm install -g @unknow69/leo-generator

# Generate your first module
leo-generate generate User name:string email:string age:number

# Check what was created
ls src/app/modules/user/
ls postman/
cat swagger.json

# Update documentation
leo-generate update-docs

# Generate complex module
leo-generate generate Order \
  customer:objectid:User \
  items:array:object:name:string:price:number \
  status:enum[pending,shipped]
```

This comprehensive command reference covers all the functionality available in your enhanced Leo Generate package! 🚀