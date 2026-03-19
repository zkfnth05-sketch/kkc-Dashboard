
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function compareDongtaeRecords() {
    const nos = ['{FFFFF66453', '{FFFFF66454'];
    console.log("--- Comparing Dongtae Records ---");
    
    for (const no of nos) {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'get_dongtae_info',
                dongtae_no: no
            })
        });
        const json = await res.json();
        console.log(`Record for [${no}]:`, json.success ? JSON.stringify(json.data) : "Not found");
    }
}
compareDongtaeRecords().catch(console.error);
