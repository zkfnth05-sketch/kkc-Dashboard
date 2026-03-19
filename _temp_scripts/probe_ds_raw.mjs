
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeRawRow() {
    const payload = {
        mode: 'execute_sql',
        queries: [
            "SELECT * FROM dogshow WHERE ds_pid = 859",
            "DESCRIBE dogshow"
        ]
    };

    try {
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("🔍 DB Probe Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

probeRawRow();
