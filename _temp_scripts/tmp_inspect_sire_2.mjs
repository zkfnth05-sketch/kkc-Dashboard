
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const sireId = '543289';
    console.log(`Inspecting Sire: ${sireId}...`);
    const resSire = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({ mode: 'list', table: 'dogTab', search: sireId, field: 'uid', limit: 1 })
    });
    const jsonSire = await resSire.json();
    const sireDNo = jsonSire.data[0].dongtae_no;
    console.log(`Sire Name: ${jsonSire.data[0].name}, Sire DNo: ${sireDNo}`);

    const resChildren = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({ mode: 'list', table: 'dogTab', search: sireId, field: 'fa_regno', limit: 100 })
    });
    const jsonChildren = await resChildren.json();
    const lits = new Set();
    jsonChildren.data.forEach(d => { if(d.dongtae_no) lits.add(d.dongtae_no); });
    console.log(`Children DNos:`, Array.from(lits).sort());
}
inspect().catch(console.error);
