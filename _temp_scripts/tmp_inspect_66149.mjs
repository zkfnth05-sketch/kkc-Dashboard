
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const dNo = '{FFFFF66149';
    console.log(`Searching for dogs with DongtaeNo: ${dNo}...`);
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
    json.data.forEach(d => {
        console.log(`Dog: ${d.name} | Sire: ${d.fa_regno} | Dam: ${d.mo_regno}`);
    });
}
inspect().catch(console.error);
