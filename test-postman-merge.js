const fs = require('fs');
const path = require('path');

// Mock simple versions of the functions for testing the logic
function savePostmanCollectionMock(moduleName, collection, outputDir = "postman") {
    const postmanDir = path.join(process.cwd(), outputDir);
    if (!fs.existsSync(postmanDir)) {
        fs.mkdirSync(postmanDir, { recursive: true });
    }
    const filePath = path.join(postmanDir, `${moduleName.toLowerCase()}.postman_collection.json`);

    let finalCollection = collection;

    if (fs.existsSync(filePath)) {
        console.log(`Checking existing file at ${filePath}`);
        try {
            const existingContent = fs.readFileSync(filePath, "utf-8");
            const existingCollection = JSON.parse(existingContent);

            if (existingCollection.item && Array.isArray(existingCollection.item)) {
                console.log(`🔄 Merging with existing local collection`);

                const existingItems = existingCollection.item;
                const newItems = collection.item;

                const newItemsMap = new Map(newItems.map((item) => [item.name, item]));
                const manualItems = existingItems.filter((existingItem) => !newItemsMap.has(existingItem.name));

                if (manualItems.length > 0) {
                    console.log(`   ✨ Preserving ${manualItems.length} manual endpoints`);
                }

                finalCollection = {
                    ...collection,
                    item: [...newItems, ...manualItems]
                };
            }
        } catch (error) {
            console.error(`Error during merge: ${error.message}`);
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(finalCollection, null, 2));
    return finalCollection;
}

// 1. Setup - Create initial collection
const initialCollection = {
    info: { name: "User API" },
    item: [
        { name: "Create User", request: { method: "POST" } },
        { name: "Get All Users", request: { method: "GET" } }
    ]
};

const outputDir = "test_postman_output";
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}

console.log("Step 1: Save initial collection");
savePostmanCollectionMock("User", initialCollection, outputDir);

// 2. Simulate manual addition
console.log("\nStep 2: Simulate manual addition of an endpoint");
const filePath = path.join(outputDir, "user.postman_collection.json");
const collectionWithManual = JSON.parse(fs.readFileSync(filePath, "utf-8"));
collectionWithManual.item.push({ name: "Manual Upload Profile", request: { method: "POST" } });
fs.writeFileSync(filePath, JSON.stringify(collectionWithManual, null, 2));

// 3. Update collection (simulating update-docs)
console.log("\nStep 3: Update collection (should preserve manual endpoint)");
const updatedCollection = {
    info: { name: "User API" },
    item: [
        { name: "Create User", request: { method: "POST", body: { raw: "{}" } } }, // Updated
        { name: "Get All Users", request: { method: "GET" } }
    ]
};

const result = savePostmanCollectionMock("User", updatedCollection, outputDir);

// 4. Verify
console.log("\nStep 4: Verify results");
const finalItems = result.item;
const names = finalItems.map(i => i.name);
console.log("Final endpoint names:", names);

const hasManual = names.includes("Manual Upload Profile");
const hasCreate = names.includes("Create User");
const hasGetAll = names.includes("Get All Users");

if (hasManual && hasCreate && hasGetAll && finalItems.length === 3) {
    console.log("\n✅ SUCCESS: Manual endpoint preserved and others updated!");
} else {
    console.error("\n❌ FAILURE: Manual endpoint missing or incorrect number of endpoints.");
    process.exit(1);
}
