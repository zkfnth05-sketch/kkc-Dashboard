
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeStructure() {
    const payload = {
        mode: 'execute_sql',
        queries: [
            "SELECT ds_pid, ds_name, ds_place, ds_organizer, ds_etc FROM dogshow ORDER BY ds_pid DESC LIMIT 1"
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
        const row = result.data?.[0]?.[0];
        console.log("💎 LATEST ROW RAW DATA:");
        if (row) {
            Object.keys(row).forEach(k => {
                console.log(`- ${k}: [${row[k]}]`);
            });
        } else {
            console.log("❌ No data found.");
        }
    } catch (e) { console.error("❌", e); }
}

probeStructure();
