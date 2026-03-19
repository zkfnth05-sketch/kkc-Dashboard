
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkSiblings() {
    const dogs = ['KJ-C00001', 'KJ-C00002'];
    console.log("--- Checking Dongtae Link for Siblings ---");
    
    for (const regNo of dogs) {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'list',
                table: 'dogTab',
                search: regNo,
                field: 'reg_no',
                limit: 1
            })
        });
        const json = await res.json();
        if (json.data && json.data.length > 0) {
            const dog = json.data[0];
            console.log(`Dog: ${regNo}, UID: ${dog.uid}, DongtaeNo: [${dog.dongtae_no}]`);
        } else {
            console.log(`Dog: ${regNo} not found.`);
        }
    }
}
checkSiblings().catch(console.error);
