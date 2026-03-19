
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function updateSchema() {
    const payload = {
        mode: 'execute_sql',
        queries: [
            "ALTER TABLE `poss_changeTab` ADD COLUMN `poss_phone` VARCHAR(20) NULL DEFAULT NULL AFTER `poss_name_eng`",
            "ALTER TABLE `poss_changeTab` ADD COLUMN `poss_addr` VARCHAR(255) NULL DEFAULT NULL AFTER `poss_phone`"
        ]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.log(`Fetch Error - ${e.message}`);
    }
}

updateSchema();
