
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Fetching ABSOLUTE latest dongtaeTab records...");
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 5,
            page: 1 // Assuming 1 is latest because of ORDER BY 1 DESC in crud_logic.php
        })
    });
    const json = await res.json();
    json.data.forEach(d => {
        console.log(`UID: ${d.uid} | DongtaeNo: ${d.dongtae_no} | Date: ${d.reg_date}`);
    });
}
inspect().catch(console.error);
