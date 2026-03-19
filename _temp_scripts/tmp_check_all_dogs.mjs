
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkAllDogs() {
    console.log("--- Checking All Dogs Dongtae Links ---");
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            limit: 20,
            order: 'uid DESC'
        })
    });
    const json = await res.json();
    json.data.forEach(d => {
        if (d.reg_no && d.reg_no.startsWith('KJ-C')) {
            console.log(`Dog: ${d.reg_no}, DongtaeNo: [${d.dongtae_no}]`);
        }
    });
}
checkAllDogs().catch(console.error);
