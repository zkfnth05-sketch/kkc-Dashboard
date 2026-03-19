
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    const tables = ['dogshow', 'stylist', 'sports_event'];
    for (const table of tables) {
        console.log(`--- TABLE: ${table} ---`);
        const payload = {
            mode: 'list',
            table: table,
            limit: 5
        };
        try {
            const response = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.data) {
                result.data.forEach(r => {
                    console.log(`Type: [${r.ds_type || ''}] | Name: [${r.ds_name || ''}]`);
                });
            } else {
                console.log("No data");
            }
        } catch (e) { console.error(e); }
    }
}
probe();
