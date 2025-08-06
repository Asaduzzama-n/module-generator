const fs = require('fs');
const path = require('path');

// Test the enhanced functionality
console.log('🧪 Testing Enhanced Leo Generate Features\n');

// Create a test directory
const testDir = 'test-output';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Change to test directory
process.chdir(testDir);

// Create a basic package.json for testing
const packageJson = {
  "name": "test-project",
  "version": "1.0.0",
  "moduleGenerator": {
    "modulesDir": "src/app/modules",
    "routesFile": "src/routes/index.ts"
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Create necessary directories
fs.mkdirSync('src/app/modules', { recursive: true });
fs.mkdirSync('src/routes', { recursive: true });

// Create a basic routes file
const routesContent = `import express from 'express';

const router = express.Router();

const apiRoutes = [
  // Routes will be added here
];

apiRoutes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
`;

fs.writeFileSync('src/routes/index.ts', routesContent);

console.log('✅ Test environment set up');
console.log('📁 Created test directory structure');
console.log('📝 Ready for module generation testing');

console.log('\n🎯 To test the enhanced features, run:');
console.log('1. cd test-output');
console.log('2. node ../dist/index.js generate TestUser name!:string email:string age:number status:enum[active,inactive]');
console.log('3. Check the generated files and documentation');