# Changelog

All notable changes to Leo Generate will be documented in this file.

## [1.7.1] - 2025-12-28

### 🔧 Fixes
- **Auth Guard Update**: Removed `SUPER_ADMIN` and `ADMIN` from default route auth guards, setting it to `GUEST` by default.
- **Validation Naming Match**: Fixed a naming mismatch between the Zod validation schema and the routes (e.g., `createOrderZodSchema`).
- **Zod Structure Improvement**: Wrapped Zod validation fields in a `body` object to match `validateRequest` middleware expectations.

## [1.7.0] - 2025-12-28

### 🌟 New: Smart Postman Documentation
- **Intelligent Endpoint Merging**: Manually added endpoints in Postman are now preserved during `update-docs` or new module generation.
- **Improved Sync Logic**: The generator now merges endpoints instead of overwriting the entire module folder, ensuring manual customizations are never lost.
- **Cloud & Local Support**: Merge logic works perfectly for both local `.postman_collection.json` files and automated Postman Cloud sync.

### 🚀 New: Postman Export Feature
- **Pull Collection Command**: Added `pull-postman` (aliases: `pull`, `export`) to fetch your entire collection from Postman Cloud and save it as a local JSON file.
- **Backup & Portability**: Easily backup your cloud collection or export it for use in other tools with a single command.

### 🛡️ Core Improvements
- **Console Feedback**: Added detailed logging during the merge process to show which manual endpoints were preserved.
- **Enhanced Reliability**: Improved error handling for Postman API interactions to prevent data loss.

## [1.6.0] - 2025-12-28

### 🌟 New: Asynchronous File Cleanup
- **Enhanced `removeFile` Helper**: Replaced synchronous cleanup logic with a robust asynchronous implementation using `fs/promises`.
- **Intelligent Path Normalization**: Automatically strips `/images/` prefixes and handles absolute/relative paths correctly.
- **Improved Reliability**: Added specific error handling for missing files (`ENOENT`) to prevent process crashes.

### 🛡️ Core Improvements
- **Async Service Templates**: Updated generated service templates to `await` file removal operations, ensuring data consistency.
- **Environment Detection**: Improved `.env` loading to prioritize Postman API keys and Collection IDs for automated syncing.
- **Enhanced `--skip` Logic**: Refined file skipping mechanism to allow bypassing any file type (interface, model, constants, etc.) during generation.

### 🔧 Fixes
- **Module Dependency Fix**: Resolved `MODULE_NOT_FOUND` errors by ensuring proper dependency installation and build synchronization.

---

## [1.5.0] - 2025-12-20

### 🚀 Major Feature: Automated Postman Cloud Sync

#### Added
- **Automated Postman Collection Import**: Automatically sync generated API collections to Postman Cloud
  - Configure via `.env`, `package.json`, or CLI flags
  - Supports `POSTMAN_API_KEY` and `POSTMAN_COLLECTION_ID`
  - Seamlessly integrates with existing local file generation
- **Smart Collection Merging**: Intelligently updates or adds module folders in existing collections
- **Sequential Processing**: Prevents race conditions when updating multiple modules
- **Variable Sanitization**: Automatically fixes invalid Postman variable types

#### Enhanced
- **update-docs Command**: Now supports automated Postman Cloud sync
  - Properly detects TypeScript enum definitions and their values
  - Correctly identifies changes to nested object properties
  - Generates accurate Postman pre-request scripts with enum value arrays
- **Enum Detection**: Enhanced field extraction to recognize TypeScript `enum` types
- **Error Handling**: Graceful handling of API errors without breaking module generation

#### Fixed
- **Postman API Variable Type Error**: Fixed validation errors caused by invalid variable types
- **Race Condition**: Fixed concurrent API update conflicts in `update-docs`
- **Enum Value Detection**: Now properly extracts enum values from interface files

---

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