# 📦 Publishing Guide for Leo Generate

## 🎯 Pre-Publishing Checklist

### ✅ Testing Completed
- [x] Basic module generation works
- [x] Complex nested structures work
- [x] Postman collections are generated correctly
- [x] Swagger documentation is generated correctly
- [x] Documentation update command works
- [x] All CLI commands function properly

### 📋 Steps to Publish to Your New NPM Account

## 1. **Setup Your NPM Account**

```bash
# Login to your new npm account
npm login

# Verify you're logged in with the correct account
npm whoami
```

## 2. **Update Package Configuration**

Update the following in `package.json`:

```json
{
  "name": "@your-username/leo-generator",  // Replace with your actual username
  "author": "Your Name <your-email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/leo-generator.git"
  }
}
```

## 3. **Remove Old Package (if exists)**

If you need to remove the old package from npm:

```bash
# Unpublish the old package (only if you own it)
npm unpublish leo-generator --force

# Or deprecate it
npm deprecate leo-generator "Package moved to @your-username/leo-generator"
```

## 4. **Build and Test**

```bash
# Clean build
rm -rf dist
npm run build

# Test locally
npm pack
npm install -g ./your-username-leo-generator-1.1.0.tgz

# Test the installed package
leo-generate generate TestModule name:string email:string
```

## 5. **Publish to NPM**

```bash
# For scoped packages, make sure it's public
npm publish --access public

# Or if it's not scoped
npm publish
```

## 6. **Verify Publication**

```bash
# Check if published successfully
npm view @your-username/leo-generator

# Install from npm to test
npm install -g @your-username/leo-generator
```

## 🚀 **Installation Instructions for Users**

After publishing, users can install with:

```bash
# Global installation
npm install -g @your-username/leo-generator

# Or use with npx
npx @your-username/leo-generator generate User name:string email:string
```

## 📝 **Version Management**

For future updates:

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major

# Then publish
npm publish --access public
```

## 🔧 **Package.json Final Configuration**

Here's what your final package.json should look like:

```json
{
  "name": "@your-username/leo-generator",
  "version": "1.1.0",
  "description": "Enhanced Express module generator with Mongoose models, Postman collections, and Swagger documentation",
  "main": "dist/index.js",
  "bin": {
    "leo-generate": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "ENHANCEMENTS.md"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/leo-generator.git"
  },
  "homepage": "https://github.com/your-username/leo-generator#readme",
  "bugs": {
    "url": "https://github.com/your-username/leo-generator/issues"
  },
  "scripts": {
    "build": "tsc && npm run copy-templates",
    "copy-templates": "if not exist dist\\templates mkdir dist\\templates && xcopy /E /I /Y src\\templates\\*.hbs dist\\templates\\",
    "prepublishOnly": "npm run build",
    "postinstall": "node -e \"try { require('fs').chmodSync(require('path').join(__dirname, 'dist/index.js'), '755') } catch(e) {}\""
  },
  "keywords": [
    "leo",
    "messi",
    "goat",
    "express",
    "mongoose",
    "generator",
    "module",
    "cli",
    "postman",
    "swagger",
    "api",
    "documentation",
    "typescript",
    "crud"
  ],
  "author": "Your Name <your-email@example.com>",
  "license": "MIT",
  "dependencies": {
    "commander": "^11.1.0",
    "handlebars": "^4.7.8"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/handlebars": "^4.1.0",
    "typescript": "^5.3.3"
  }
}
```

## 🎉 **Post-Publishing**

1. **Update README**: Make sure installation instructions reflect the new package name
2. **Create GitHub Release**: Tag the version and create a release
3. **Share**: Share your enhanced package with the community!

## 🔍 **Testing the Published Package**

After publishing, test with:

```bash
# Install globally
npm install -g @your-username/leo-generator

# Test basic functionality
leo-generate generate User name!:string email:string age:number

# Test complex structures
leo-generate generate Order customer:objectid:User items:array:object:name:string:price:number status:enum[pending,shipped]

# Test documentation updates
leo-generate update-docs

# Check generated files
ls postman/
cat swagger.json
```

## 📊 **What's New in v1.1.0**

- ✅ **Complex nested field support**
- ✅ **Production-ready CRUD operations**
- ✅ **Automatic Postman collection generation**
- ✅ **Swagger/OpenAPI documentation generation**
- ✅ **Bulk documentation updates**
- ✅ **Enhanced CLI with new commands**
- ✅ **Backward compatibility maintained**

Your enhanced Leo Generate is ready to be the best Express.js module generator on npm! 🚀