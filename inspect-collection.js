// Fetch is global in Node 18+

async function inspectCollection() {
    const apiKey = process.env.POSTMAN_API_KEY;
    const collectionId = process.env.POSTMAN_COLLECTION_ID;

    const response = await fetch(`https://api.getpostman.com/collections/${collectionId}`, {
        headers: { 'X-Api-Key': apiKey }
    });

    const data = await response.json();

    if (data.collection && data.collection.variable) {
        console.log('Variables in collection:');
        data.collection.variable.forEach((v, i) => {
            console.log(`  [${i}] key: "${v.key}", type: "${v.type}", value: "${v.value || 'N/A'}"`);
        });
    } else {
        console.log('No variables found or collection not retrieved');
    }
}

inspectCollection().catch(console.error);
