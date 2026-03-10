
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeType() {
    const payload = {
        mode: 'execute_sql',
        queries: ["SELECT ds_pid, ds_type, HEX(ds_type) as hex_type FROM dogshow WHERE ds_pid = 866"]
    };
    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(data.results[0]);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
probeType();
