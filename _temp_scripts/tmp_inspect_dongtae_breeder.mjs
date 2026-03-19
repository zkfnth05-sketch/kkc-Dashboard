
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    console.log("Fetching dongtaeTab records with breeder...");
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
    json.data.forEach(d => {
        if (d.breeder) console.log(`DongtaeNo: ${d.dongtae_no} | Breeder: ${d.breeder} | Fa: ${d.fa_reg_no} | Mo: ${d.mo_reg_no}`);
    });
}
inspect().catch(console.error);
