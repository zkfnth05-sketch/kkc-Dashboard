
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeAll() {
    const tables = [
        'dogshow_applicant',
        'stylist_applicant',
        'sports_applicant',
        'agility_applicant',
        'discdog_applicant',
        'flyball_applicant',
        'seminar_applicant'
    ];

    for (const table of tables) {
        const payload = {
            mode: 'list',
            table: table,
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
                console.log(`Columns for ${table}:`, Object.keys(data.data[0]));
            } else {
                console.log(`No data or empty for ${table}`);
            }
        } catch (e) {
            console.log(`Error for ${table}: ${e.message}`);
        }
    }
}

probeAll();
