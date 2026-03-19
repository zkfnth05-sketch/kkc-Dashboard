
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function mergeTo66453() {
    const dogUid = '544962'; // KJ-C00002
    const targetNo = '{FFFFF66453';
    
    console.log(`Merging Dog ${dogUid} (KJ-C00002) to Dongtae No: ${targetNo}...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'update_record',
            table: 'dogTab',
            data: {
                uid: dogUid,
                dongtae_no: targetNo
            }
        })
    });
    const json = await res.json();
    console.log("Merge Result:", json);
}
mergeTo66453().catch(console.error);
