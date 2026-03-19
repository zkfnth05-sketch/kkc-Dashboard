
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Fetching dogs with dongtae info...");
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            limit: 50
        })
    });
    const json = await res.json();
    
    for (const d of json.data) {
        if (d.dongtae_no && d.dongtae_no !== '0' && d.dongtae_no !== '-') {
            console.log(`Dog: ${d.name} | DongtaeNo: ${d.dongtae_no} | Sire: ${d.fa_regno} | Dam: ${d.mo_regno}`);
            
            // If parents exist, get their info
            if (d.fa_regno && d.fa_regno !== '0') {
                 const resSire = await fetch(BRIDGE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                    body: JSON.stringify({
                        mode: 'list',
                        table: 'dogTab',
                        search: d.fa_regno,
                        field: 'reg_no',
                        limit: 1
                    })
                });
                const jsonSire = await resSire.json();
                if (jsonSire.data && jsonSire.data.length > 0) {
                    console.log(`  -> Sire: ${jsonSire.data[0].name}, Sire DongtaeNo: ${jsonSire.data[0].dongtae_no}`);
                }
            }
        }
    }
}
inspect().catch(console.error);
