// Simple test to verify the enhanced functionality
const { parseFieldDefinitions } = require('./src/utils/fieldParser');
const { generatePostmanCollection } = require('./src/utils/postmanGenerator');
const { generateSwaggerSchemas } = require('./src/utils/swaggerGenerator');

// Test field parsing
console.log('Testing field parsing...');
const testArgs = ['name!:string', 'email:string', 'age:number', 'status:enum[active,inactive]', 'items:array:object:name:string:price:number'];
const { fields } = parseFieldDefinitions(testArgs);
console.log('Parsed fields:', JSON.stringify(fields, null, 2));

// Test Postman generation
console.log('\nTesting Postman collection generation...');
try {
  const postmanCollection = generatePostmanCollection('User', fields);
  console.log('Postman collection generated successfully');
  console.log('Collection name:', postmanCollection.info.name);
  console.log('Number of requests:', postmanCollection.item.length);
} catch (error) {
  console.error('Postman generation error:', error.message);
}

// Test Swagger generation
console.log('\nTesting Swagger schema generation...');
try {
  const swaggerSchemas = generateSwaggerSchemas('User', fields);
  console.log('Swagger schemas generated successfully');
  console.log('Schema names:', Object.keys(swaggerSchemas));
} catch (error) {
  console.error('Swagger generation error:', error.message);
}

console.log('\n✅ All tests completed!');