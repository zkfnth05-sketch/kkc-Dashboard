
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Searching for reg_no patterns like 'MS-A% or %-A%'...");
    
    // We can use the 'list' mode search.
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: '-A',
            field: 'reg_no',
            limit: 20
        })
    });
    const json = await res.json();
    
    console.log(`Found ${json.data.length} records matching '-A'.`);
    json.data.forEach(d => {
        console.log(`Name: ${d.name} | RegNo: ${d.reg_no} | DNo: ${d.dongtae_no}`);
    });
}
inspect().catch(console.error);
