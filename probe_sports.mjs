
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeSports() {
    const payload = {
        mode: 'execute_sql',
        queries: [
            "SELECT ds_pid, ds_name, ds_type FROM sports_event LIMIT 20"
        ]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.results && data.results[0]) {
            console.log('--- Sports Event Type Probe ---');
            data.results[0].forEach(row => {
                console.log(`ID: ${row.ds_pid} | Type: [${row.ds_type}] | Name: ${row.ds_name}`);
            });
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

probeSports();
