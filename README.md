# module-generator

A command-line tool for generating Express.js modules with Mongoose models, controllers, services, and routes. Version: 1.0.7

## Features

- Generate complete module structure with a single command
- Create TypeScript interfaces, Mongoose models, controllers, services, and routes
- Automatically register new routes in your central router file
- Support for custom field definitions with various data types
- Configurable through package.json or command-line options
- Automatic Zod validation schema generation based on field definitions
- Ability to skip specific file types during generation
- Support for complex array of objects with defined properties

## Installation

### Global Installation

```bash
npm install -g express-module-generator
```

### Local Installation

```bash
npm install --save-dev express-module-generator
```

## Configuration

You can configure the module generator by adding a `moduleGenerator` section to your `package.json`:

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "moduleGenerator": {
    "modulesDir": "src/app/modules",
    "routesFile": "src/routes/index.ts"
  }
}
```

### Configuration Options

| Option       | Description                             | Default               |
| ------------ | --------------------------------------- | --------------------- |
| `modulesDir` | Directory where modules will be created | `src/app/modules`     |
| `routesFile` | Path to the central router file         | `src/routes/index.ts` |

## Usage

### Basic Usage

```bash
npx create-module User
```

This will create a new module named "User" with the following structure:

```
src/app/modules/user/
├── user.interface.ts
├── user.model.ts
├── user.controller.ts
├── user.service.ts
├── user.route.ts
├── user.validation.ts
└── user.constants.ts
```

### Adding Fields

You can define fields for your model by adding them as arguments:

```bash
npx create-module User name:string email:string age:number isActive:boolean
```

### Field Definition Syntax

Fields follow this syntax: `fieldName:type:reference`

- `fieldName`: The name of the field
- `type`: The data type (string, number, boolean, date, array, object, objectId)
- `reference` (optional): For ObjectId fields, the referenced model name

#### Optional and Required Fields

- Add `?` after the field name to mark it as optional: `email?:string`
- Add `!` after the field name to mark it as required: `email!:string`

### Array of Objects with Properties

You can define arrays of objects with specific properties using this syntax:

```bash
fieldName:array:object:propName1:propType1:propName2:propType2...
```

For example:

```bash
variants:array:object:name:string:price:number:color:string:size:string
```

You can also mark object properties as optional or required:

```bash
variants:array:object:name:string:price:number:color?:string:size!:string
```

### Skipping File Types

You can skip generating specific file types by using the `--skip` flag followed by the file types:

```bash
npx create-module User name:string email:string --skip validation route
```

This will skip generating the validation and route files for the module.

### Examples

```bash
# Create a User module with basic fields
npx create-module User name:string email:string age:number

# Create a Product module with references
npx create-module Product name:string price:number category:objectId:Category

# Create a Blog module with optional and required fields
npx create-module Blog title!:string content:string author?:objectId:User tags:array

# Create a Product module with array of objects
npx create-module Product name:string price:number variants:array:object:name:string:price:number:color:string:size:string

# Create a Comment module but skip certain files
npx create-module Comment text:string author:objectId:User --skip constants validation
```

### Command-line Options

You can override configuration options using command-line flags:

```bash
npx create-module User --modules-dir src/modules --routes-file src/api/routes.ts
```

## Generated Files

### Interface (.interface.ts)

Contains TypeScript interfaces for your model and any nested types.

### Model (.model.ts)

Contains the Mongoose schema and model definition.

### Controller (.controller.ts)

Contains controller functions for handling HTTP requests.

### Service (.service.ts)

Contains business logic and database operations.

### Route (.route.ts)

Contains Express router definitions for the module.

### Validation (.validation.ts)

Contains Zod validation schemas for request validation, automatically generated based on your field definitions.

### Constants (.constants.ts)

Contains constants related to the module.

## License

MIT

```

```
