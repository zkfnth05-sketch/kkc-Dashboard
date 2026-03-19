
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Fetching dongtaeTab records with multiple puppies...");
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 100
        })
    });
    const json = await res.json();
    
    const multi = json.data.filter(d => {
        const m = parseInt(d.birth_M || 0);
        const f = parseInt(d.birth_F || 0);
        return (m + f) > 1;
    });
    
    console.log(`Found ${multi.length} records with multiple puppies.`);
    for (const d of multi.slice(0, 5)) {
        console.log(`DNo: ${d.dongtae_no} | Start: ${d.regno_start} | End: ${d.regno_end} | M:${d.birth_M} F:${d.birth_F}`);
        
        const resDogs = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'list',
                table: 'dogTab',
                search: d.dongtae_no,
                field: 'dongtae_no',
                limit: 20
            })
        });
        const jsonDogs = await resDogs.json();
        console.log(`  Dogs registered: ${jsonDogs.data.length}`);
        jsonDogs.data.forEach(dog => {
            console.log(`    - ${dog.name} | RegNo: ${dog.reg_no}`);
        });
    }
}
inspect().catch(console.error);
