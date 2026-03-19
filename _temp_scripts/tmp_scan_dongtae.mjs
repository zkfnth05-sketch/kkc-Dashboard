
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    let offset = 0;
    let found = 0;
    console.log("Scanning dongtaeTab for parent info...");
    for (let i = 0; i < 5; i++) {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'list',
                table: 'dongtaeTab',
                limit: 100,
                page: i + 1
            })
        });
        const json = await res.json();
        const records = json.data.filter(d => d.fa_reg_no && d.fa_reg_no !== '0' && d.fa_reg_no !== '');
        if (records.length > 0) {
            records.forEach(r => {
                console.log(`DongtaeNo: ${r.dongtae_no} | Father: ${r.fa_reg_no} | Mother: ${r.mo_reg_no} | Date: ${r.reg_date}`);
                found++;
            });
        }
    }
    console.log(`Scan complete. Found ${found} records.`);
}
inspect().catch(console.error);
