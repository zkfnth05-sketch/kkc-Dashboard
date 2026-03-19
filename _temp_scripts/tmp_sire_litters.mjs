
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const sireId = '544146';
    console.log(`Searching for litters of Sire: ${sireId}...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: sireId,
            field: 'fa_regno',
            limit: 50
        })
    });
    const json = await res.json();
    const lits = new Set();
    json.data.forEach(d => {
        if (d.dongtae_no) lits.add(d.dongtae_no);
    });
    console.log(`Sire has litters with DongtaeNos:`, Array.from(lits).sort());
}
inspect().catch(console.error);
