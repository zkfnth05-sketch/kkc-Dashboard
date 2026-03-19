
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspectDongtae() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 1
        })
    });
    const json = await res.json();
    if (json.data && json.data.length > 0) {
        console.log("Dongtae sample keys:", Object.keys(json.data[0]).join(', '));
        console.log("Sample memo value:", json.data[0].memo);
        console.log("Sample dongtae_no value:", json.data[0].dongtae_no);
    } else {
        console.log("No dongtae records found.");
    }
}
inspectDongtae().catch(console.error);
