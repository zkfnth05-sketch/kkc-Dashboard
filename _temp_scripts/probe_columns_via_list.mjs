
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeColumns() {
    const payload = {
        mode: 'list',
        table: 'dogshow_applicant',
        limit: 1
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
            console.log("Columns found in dogshow_applicant:");
            console.log(Object.keys(data.data[0]));
        } else {
            console.log("No data returned or error:", data);
        }
    } catch (e) {
        console.log(`Fetch Error - ${e.message}`);
    }
}

probeColumns();
