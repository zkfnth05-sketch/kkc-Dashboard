
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function test() {
    const sireUid = '544146';
    console.log(`Searching for dog with UID: ${sireUid} via list mode...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: sireUid,
            field: 'uid',
            limit: 1
        })
    });
    const json = await res.json();
    console.log("Success:", json.success);
    console.log("Data length:", json.data ? json.data.length : 0);
    if (json.data && json.data.length > 0) {
        console.log("Dog Name:", json.data[0].name);
    }
}
test().catch(console.error);
