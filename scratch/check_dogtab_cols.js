
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeDb() {
    const table = 'dogTab';
    console.log(`--- Checking columns for ${table} ---`);
    const payload = {
        mode: 'execute_sql',
        queries: [`SHOW COLUMNS FROM ${table}`]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.results && data.results[0]) {
            const columns = data.results[0].map(c => c.Field);
            console.log("Columns in dogTab:", columns.join(', '));
        } else {
            console.error(`Error for ${table}:`, data.error || data);
        }
    } catch (e) {
        console.error(`Fetch Error for ${table}:`, e.message);
    }
}

probeDb();
