
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const sireId = '544146';
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: sireId,
            field: 'uid', // Using UID search
            limit: 1
        })
    });
    const json = await res.json();
    if (json.data && json.data.length > 0) {
        console.log(`Sire Info: Name: ${json.data[0].name}, DongtaeNo: ${json.data[0].dongtae_no}, RegNo: ${json.data[0].reg_no}`);
    } else {
        console.log("Sire not found");
    }
}
inspect().catch(console.error);
