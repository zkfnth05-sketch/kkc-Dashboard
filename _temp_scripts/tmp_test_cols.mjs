
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkColumns() {
    const payload = {
        mode: 'execute_sql',
        queries: ["SHOW COLUMNS FROM `poss_changeTab`"]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        // execute_sql doesn't return results, let's use list mode or a custom PHP
        console.log("SQL Batch status:", data);
    } catch (e) {
        console.log(`Fetch Error - ${e.message}`);
    }
}
checkColumns();
