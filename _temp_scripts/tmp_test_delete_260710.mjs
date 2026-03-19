
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testDeleteRecord260710() {
    const uid = '260710';
    console.log(`Testing deletion of UID: ${uid}...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'delete_record',
            table: 'dongtaeTab',
            id: uid
        })
    });
    const json = await res.json();
    console.log("Result:", json);
}
testDeleteRecord260710().catch(console.error);
