
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkRecentDongtae() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 5,
            order: 'uid DESC'
        })
    });
    const json = await res.json();
    console.log("Recent Dongtae Records:");
    json.data.forEach(d => {
        console.log(`- UID: ${d.uid}, No: "${d.dongtae_no}", Memo: "${d.memo}", Birth_M: "${d.birth_M}"`);
    });
}
checkRecentDongtae().catch(console.error);
