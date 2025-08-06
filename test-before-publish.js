#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Pre-Publishing Test Suite\n');

// Test 1: Check if dist directory exists and has required files
console.log('1. Checking build artifacts...');
const requiredFiles = [
  'dist/index.js',
  'dist/types.js',
  'dist/utils/postmanGenerator.js',
  'dist/utils/swaggerGenerator.js',
  'dist/utils/documentationUpdater.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Build artifacts missing. Run: npx tsc');
  process.exit(1);
}

// Test 2: Check package.json
console.log('\n2. Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = ['name', 'version', 'description', 'main', 'bin'];
requiredFields.forEach(field => {
  if (packageJson[field]) {
    console.log(`   ✅ ${field}: ${typeof packageJson[field] === 'object' ? JSON.stringify(packageJson[field]) : packageJson[field]}`);
  } else {
    console.log(`   ❌ ${field} - MISSING`);
  }
});

// Test 3: Test CLI functionality
console.log('\n3. Testing CLI functionality...');
try {
  // Create a temporary test directory
  const testDir = 'temp-test-' + Date.now();
  fs.mkdirSync(testDir, { recursive: true });
  
  // Create basic structure
  fs.mkdirSync(path.join(testDir, 'src/app/modules'), { recursive: true });
  fs.mkdirSync(path.join(testDir, 'src/routes'), { recursive: true });
  
  // Create package.json
  fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    moduleGenerator: {
      modulesDir: 'src/app/modules',
      routesFile: 'src/routes/index.ts'
    }
  }, null, 2));
  
  // Create routes file
  fs.writeFileSync(path.join(testDir, 'src/routes/index.ts'), `
import express from 'express';
const router = express.Router();
const apiRoutes = [];
apiRoutes.forEach(route => {
  router.use(route.path, route.route);
});
export default router;
  `);
  
  // Test module generation
  process.chdir(testDir);
  execSync('node ../dist/index.js generate TestModule name:string email:string', { stdio: 'pipe' });
  
  // Check if files were created
  const expectedFiles = [
    'src/app/modules/testmodule/testmodule.interface.ts',
    'src/app/modules/testmodule/testmodule.model.ts',
    'src/app/modules/testmodule/testmodule.controller.ts',
    'src/app/modules/testmodule/testmodule.service.ts',
    'postman/testmodule.postman_collection.json',
    'swagger.json'
  ];
  
  let testPassed = true;
  expectedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ Generated: ${file}`);
    } else {
      console.log(`   ❌ Missing: ${file}`);
      testPassed = false;
    }
  });
  
  // Cleanup
  process.chdir('..');
  fs.rmSync(testDir, { recursive: true, force: true });
  
  if (testPassed) {
    console.log('\n🎉 All tests passed! Ready for publishing.');
    console.log('\n📦 To publish:');
    console.log('1. Update package.json with your npm username');
    console.log('2. npm login');
    console.log('3. npm publish --access public');
  } else {
    console.log('\n❌ Some tests failed. Please fix before publishing.');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`   ❌ CLI test failed: ${error.message}`);
  process.exit(1);
}