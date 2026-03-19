
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Searching for siblings of Sire (DongtaeNo: {FFFFF66148)...");
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: '{FFFFF66148',
            field: 'dongtae_no',
            limit: 10
        })
    });
    const json = await res.json();
    console.log(`Found ${json.data.length} siblings.`);
    json.data.forEach(d => {
        console.log(`Dog: ${d.name} | UID: ${d.uid} | RegNo: ${d.reg_no}`);
    });
}
inspect().catch(console.error);
