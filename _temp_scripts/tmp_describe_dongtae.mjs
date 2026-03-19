
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'execute_sql',
            queries: ['DESCRIBE dongtaeTab']
        })
    });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
}
inspect().catch(console.error);
