
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeAll() {
    const tables = ['dogshow', 'stylist', 'sports_event', 'seminar'];
    for (const t of tables) {
        const payload = {
            mode: 'execute_sql',
            queries: ["SELECT COUNT(*) as cnt FROM " + t]
        };
        try {
            const res = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success && data.results && data.results[0] && data.results[0][0]) {
                console.log("Table " + t + ": " + data.results[0][0].cnt);
            } else {
                console.log("Table " + t + ": Error or No match");
            }
        } catch (e) {
            console.log("Error " + t + ": " + e.message);
        }
    }
}
probeAll();
