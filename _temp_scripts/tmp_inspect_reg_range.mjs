
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Fetching dongtaeTab records with regno_start/end...");
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 50
        })
    });
    const json = await res.json();
    
    const relevant = json.data.filter(d => d.regno_start && d.regno_start.trim() !== '' && d.regno_start !== '0');
    
    console.log(`Found ${relevant.length} records with regno_start.`);
    relevant.slice(0, 10).forEach(d => {
        console.log(`DNo: ${d.dongtae_no} | Start: ${d.regno_start} | End: ${d.regno_end} | Names: ${d.dongtae_name}, ${d.dongtae_name2}`);
    });

    if (relevant.length > 0) {
        const first = relevant[0];
        console.log(`\nInspecting dogs associated with DNo: ${first.dongtae_no}...`);
        const resDogs = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'list',
                table: 'dogTab',
                search: first.dongtae_no,
                field: 'dongtae_no',
                limit: 20
            })
        });
        const jsonDogs = await resDogs.json();
        jsonDogs.data.forEach(dog => {
            console.log(`  Dog: ${dog.name} | RegNo: ${dog.reg_no} | UID: ${dog.uid}`);
        });
    }
}
inspect().catch(console.error);
