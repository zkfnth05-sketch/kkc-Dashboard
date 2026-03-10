
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    // 🚀 [USE LIST MODE TO GET SCHEMA CLUES]
    const tables = ['dogshow', 'stylist', 'sports_event', 'seminar', 'breed_exam'];
    for (const table of tables) {
        console.log(`--- PROBING TABLE: ${table} ---`);
        try {
            const response = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                body: JSON.stringify({ mode: 'list', table: table, limit: 1 })
            });
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                console.log(JSON.stringify(Object.keys(result.data[0]), null, 2));
            } else {
                console.log("No data or error:", result.error || "empty");
            }
        } catch (e) {
            console.error(e);
        }
    }
}
probe();
