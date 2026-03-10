
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    try {
        const payload = {
            mode: 'execute_sql',
            queries: [
                "SHOW CREATE TABLE dogshow",
                "SHOW CREATE TABLE dogshow_applicant"
            ]
        };
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            console.log("HTTP Error: " + response.status);
            return;
        }
        const data = await response.json();
        if (!data.success) {
            console.log("API Error: " + JSON.stringify(data));
            return;
        }
        console.log("SUCCESS");
        console.log(JSON.stringify(data.results, null, 2));
    } catch (e) {
        console.log("Exception: " + e.message);
    }
}
probe();
