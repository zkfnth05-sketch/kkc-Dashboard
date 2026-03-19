
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testDelete() {
    // 1. Create a dummy record first
    console.log("Creating dummy record...");
    const createRes = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'create_record',
            table: 'dongtaeTab',
            data: { dongtae_no: 'DELETE_TEST_001', memo: 'Delete Test' }
        })
    });
    const createJson = await createRes.json();
    console.log("Create Result:", createJson);
    
    if (createJson.success) {
        const uid = createJson.id;
        console.log(`Deleting record UID: ${uid}...`);
        const deleteRes = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'delete_record',
                table: 'dongtaeTab',
                id: uid
            })
        });
        const deleteJson = await deleteRes.json();
        console.log("Delete Result:", deleteJson);
    }
}
testDelete().catch(console.error);
