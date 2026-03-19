
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: 'CHESSE VON DEN BOTANIK ISLAND',
            field: 'name',
            limit: 1
        })
    });
    const json = await res.json();
    if (json.data && json.data.length > 0) {
        console.log(`Child Info: Name: ${json.data[0].name}, DongtaeNo: ${json.data[0].dongtae_no}, RegNo: ${json.data[0].reg_no}`);
    }
}
inspect().catch(console.error);
