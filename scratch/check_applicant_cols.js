
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkApplicantTable() {
    const table = 'dogshow_applicant';
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
            console.log("Columns in dogshow_applicant:", columns.join(', '));
        } else {
            console.log("Full data:", JSON.stringify(data));
        }
    } catch (e) {
        console.error(`Fetch Error:`, e.message);
    }
}

checkApplicantTable();
