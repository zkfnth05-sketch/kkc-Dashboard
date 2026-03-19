
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 1
        })
    });
    const json = await res.json();
    if (json.data && json.data.length > 0) {
        console.log("Keys in dongtaeTab:", Object.keys(json.data[0]).join(', '));
        console.log("Full data sample:", JSON.stringify(json.data[0], null, 2));
    }
}
inspect().catch(console.error);
