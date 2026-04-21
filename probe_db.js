const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeDb() {
    const tables = [
        'stylist_intl_applicant'
    ];

    for (const table of tables) {
        console.log(`--- Checking ${table} ---`);
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
            if (data.success) {
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.error(`Error for ${table}:`, data.error);
            }
        } catch (e) {
            console.error(`Fetch Error for ${table}:`, e.message);
        }
    }
}

probeDb();
