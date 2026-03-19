
// This uses built-in fetch (available in Node.js 18+)
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkIds() {
    const payload = {
        mode: 'list',
        table: 'memTab',
        limit: 20
    };

    const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': SECRET_KEY
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Top 20 Members:");
    if (data.success && data.data) {
        data.data.forEach(m => {
            console.log(`MID: ${m.mid}, LoginID (id): ${m.id}, Name: ${m.name}`);
        });
    } else {
        console.log("Failed to fetch:", data);
    }
}

checkIds();
