
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const dNo = '{FFFFF66447'; // Example from previous logs
    console.log(`Inspecting dogs for DongtaeNo: ${dNo}...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: dNo,
            field: 'dongtae_no',
            limit: 5
        })
    });
    const json = await res.json();
    console.log("Found dogs:", json.data.length);
    if (json.data.length > 0) {
        console.log("First dog sample keys:", Object.keys(json.data[0]).join(', '));
        console.log("Sire field:", json.data[0].fa_regno);
        console.log("Dam field:", json.data[0].mo_regno);
    }
}
inspect().catch(console.error);
