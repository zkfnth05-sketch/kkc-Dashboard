
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkDogData() {
    const regNos = ['MIX-C00001', 'fddffd'];
    const payload = {
        mode: 'execute_sql',
        queries: [
            `SELECT uid, reg_no, name, birth, fa_regno, mo_regno FROM dogTab WHERE reg_no IN ('MIX-C00001', 'fddffd')`
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
        console.error(`Fetch Error:`, e.message);
    }
}

checkDogData();
