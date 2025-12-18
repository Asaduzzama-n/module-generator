# Changelog

All notable changes to Leo Generate will be documented in this file.

## [1.4.0] - 2025-12-18

### 🚀 Major Enhancements
- **Enhanced Enum Support**: Now uses TypeScript Enums (`export enum StatusEnum {...}`) instead of string unions, with proper validation using `z.nativeEnum` and Mongoose `Object.values`.
- **File Removal Support**: Added `--file:true` flag. When used, automatically:
  - Generates a `fileHelper` utility for removing uploaded files.
  - Adds cleanup logic to the delete service to remove associated files (images/media) when a record is deleted.
- **Smart Postman Scripts**: Pre-request scripts now auto-generate dynamic values for request bodies (e.g., timestamps, random numbers, random enum values), making testing easier.
- **Nested Schema Fixes**: Improved nested schema generation order to ensure dependencies are defined before use.

---

## [1.3.1] - 2025-08-07

### 🔧 Bug Fixes
- **CLI Version**: Fixed hardcoded version display in CLI to match package.json version

---

## [1.3.0] - 2025-08-06

### 🏭 Production-Ready Templates

#### Updated Templates to Match Production Patterns
- **Service Template**: Now includes `JwtPayload user` parameter, proper pagination with `paginationHelper`, advanced search and filtering
- **Controller Template**: Updated with `req.user!` authentication, file handling for `images/media`, proper request structure
- **Route Template**: Added comprehensive auth middleware, role-based access control, file upload middleware integration
- **Constants Template**: Auto-generates filterable and searchable fields based on field types
- **Interface Template**: Auto-generates `IModuleFilterables` interface for type-safe filtering

#### Enhanced Features
- **Role-Based Access Control**: Routes now include proper auth middleware with USER_ROLES
- **Advanced Pagination**: Integrated with `paginationHelper.calculatePagination()`
- **Search & Filter**: Automatic generation of searchable and filterable fields
- **File Upload Support**: Proper handling of `images` and `media` fields with middleware
- **Type Safety**: Enhanced interfaces with filter types for better TypeScript support

#### Production Patterns
- **Authentication**: All routes protected with role-based auth middleware
- **Error Handling**: Enhanced error handling with proper status codes
- **Validation**: Integrated request validation with Zod schemas
- **Response Structure**: Consistent API response patterns
- **Code Organization**: Follows production-grade folder and file structure

---

## [1.2.0] - 2025-08-06

### 🧠 Enhanced Documentation Intelligence

#### Added
- **Code-Aware Documentation Updates**: System now reads both interface and model files for complete accuracy
- **Smart Field Extraction**: Enhanced parsing that handles complex nested structures and type mappings
- **Enum Value Detection**: Automatically extracts actual enum values from Mongoose schemas
- **Array Type Intelligence**: Generates proper sample data for all array types (string[], number[], boolean[], etc.)
- **100% Syntax Support**: Now handles every field type the generator can create
- **Robust Interface Parsing**: Correctly identifies main interfaces vs nested interfaces

#### Improved
- **Postman Collection Generation**: Now generates type-appropriate sample data
  - `scores:array:number` → `"scores": [123]` (was `["sample_scores_item"]`)
  - `flags:array:boolean` → `"flags": [true]` (was `["sample_flags_item"]`)
  - `status:enum[active,inactive]` → `"status": "active"` (was `"status": "sample_status"`)
- **Swagger Documentation**: Enhanced schema generation with proper type definitions
- **Field Type Detection**: More accurate mapping of TypeScript types to field definitions
- **Nested Object Support**: Better handling of complex array-of-object structures

#### Fixed
- **Documentation Sync Issues**: Updates now accurately reflect code changes
- **Array Type Parsing**: Fixed incorrect sample data generation for typed arrays
- **Enum Value Extraction**: Now properly extracts enum values from model files
- **Interface Detection**: Improved logic to find main interface vs helper interfaces

### 📊 Technical Improvements

#### Enhanced Parsing Logic
- Improved regex patterns for interface and model file parsing
- Better handling of multiline field definitions
- Enhanced type mapping for complex structures
- Robust error handling and fallback mechanisms

#### Sample Data Generation
- Type-aware sample data for all field types
- Proper ObjectId string generation for references
- Realistic enum value selection from actual schema definitions
- Correct nested object structure preservation

### 🔧 Developer Experience

#### Better Feedback
- Detailed logging showing exactly which fields are extracted
- Clear indication of interface and model file processing
- Progress reporting during bulk documentation updates

#### Reliability
- More robust parsing that handles edge cases
- Better error messages for troubleshooting
- Fallback mechanisms for incomplete type information

---

## [1.1.0] - 2025-08-05

### 🚀 Major Feature Release

#### Added
- **Complex/Nested Fields Support**: Arrays of objects, nested structures, references
- **Production-Ready CRUD Operations**: Enhanced controllers and services with pagination
- **Postman Integration**: Automatic API collection generation
- **Swagger Integration**: OpenAPI 3.0 documentation generation
- **Bulk Documentation Updates**: Update docs for all existing modules

#### Enhanced
- **Field Type Support**: Comprehensive support for all data types
- **CLI Interface**: New command structure with aliases
- **Error Handling**: Improved error messages and validation
- **Code Generation**: More robust and production-ready templates

---

## [1.0.0] - 2025-08-04

### 🎉 Initial Release

#### Core Features
- Basic module generation with TypeScript support
- Mongoose model creation
- Express controller and service generation
- RESTful route setup
- Zod validation schemas
- Basic field type support

#### Supported Field Types
- Basic types: string, number, boolean, date
- ObjectId references
- Simple arrays
- Basic enum support

---

## Version Numbering

- **Major** (x.0.0): Breaking changes or major new features
- **Minor** (1.x.0): New features, backward compatible
- **Patch** (1.1.x): Bug fixes, backward compatible