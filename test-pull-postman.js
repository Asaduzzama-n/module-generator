const fs = require('fs');
const path = require('path');

// Mock function for saveFullPostmanCollection
function saveFullPostmanCollectionMock(collection, outputFilePath = "postman/full_collection.postman_collection.json") {
    const fullPath = path.isAbsolute(outputFilePath)
        ? outputFilePath
        : path.join(process.cwd(), outputFilePath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, JSON.stringify({ collection }, null, 2));
    console.log(`✅ Full Postman collection exported to: ${fullPath}`);
    return fullPath;
}

// 1. Setup - Create mock collection data
const mockCollection = {
    info: { name: "Full API Collection" },
    item: [
        { name: "User API", item: [] },
        { name: "Product API", item: [] }
    ]
};

const testOutputDir = "test_pull_output";
if (fs.existsSync(testOutputDir)) {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
}

const testFile = path.join(testOutputDir, "my_export.json");

console.log("Step 1: Save full collection to custom path");
const resultPath = saveFullPostmanCollectionMock(mockCollection, testFile);

// 2. Verify
console.log("\nStep 2: Verify file contents");
if (fs.existsSync(resultPath)) {
    const content = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
    if (content.collection && content.collection.info.name === "Full API Collection") {
        console.log("✅ SUCCESS: Collection data correctly saved!");
        console.log("Collection name:", content.collection.info.name);
        console.log("Number of root folders:", content.collection.item.length);
    } else {
        console.error("❌ FAILURE: Saved data is incorrect.");
        process.exit(1);
    }
} else {
    console.error("❌ FAILURE: Export file not created.");
    process.exit(1);
}

// Cleanup
fs.rmSync(testOutputDir, { recursive: true, force: true });
console.log("\nCleanup completed.");
