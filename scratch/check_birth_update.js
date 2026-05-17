
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkBirthUpdate() {
    const regNo = 'MIX-C00001';
    console.log(`--- Checking if birth date is updated for ${regNo} ---`);
    const payload = {
        mode: 'execute_sql',
        queries: [
            `SELECT uid, reg_no, name, birth FROM dogTab WHERE reg_no = '${regNo}'`
        ]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        // SELECT 결과는 kkc_handle_sql_batch에서 results로 안 나오므로 mode: list로 다시 시도
        const listPayload = {
            mode: 'list',
            table: 'dogTab',
            search: regNo,
            field: 'reg_no',
            limit: 1
        };
        const lRes = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(listPayload)
        });
        const lData = await lRes.json();
        console.log(JSON.stringify(lData, null, 2));
    } catch (e) {
        console.error(`Fetch Error:`, e.message);
    }
}

checkBirthUpdate();
