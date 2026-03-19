
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Searching for dongtae records with parent info...");
    // Since we don't have a direct SQL mode easily, we'll just try to search for some common reg_no patterns or just scan more records.
    // Or better, since we have 'list' mode, let's try to search by a known field or just get a larger batch.
    
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
    if (!json.success) {
        console.error("API Error:", json.error);
        return;
    }

    const withParents = json.data.filter(d => d.fa_reg_no && d.fa_reg_no !== '0');
    console.log(`Found ${withParents.length} records with father info.`);
    
    withParents.slice(0, 10).forEach(d => {
        console.log(`DongtaeNo: ${d.dongtae_no} | Father: ${d.fa_reg_no} | Mother: ${d.mo_reg_no}`);
    });
}
inspect().catch(console.error);
