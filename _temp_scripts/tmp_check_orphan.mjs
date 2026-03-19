
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkOrphan() {
    const targetDT = '{FFFFF66453';
    console.log(`Searching for dogs linked to [${targetDT}]...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: targetDT,
            field: 'dongtae_no'
        })
    });
    const json = await res.json();
    console.log(`Found ${json.data ? json.data.length : 0} dogs.`);
    if (json.data) {
        json.data.forEach(d => console.log(`- ${d.name} (${d.reg_no})`));
    }
}
checkOrphan().catch(console.error);
