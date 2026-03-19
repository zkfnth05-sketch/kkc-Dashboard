
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function repairKJC00001() {
    const dogUid = '544961'; 
    const dongtaeNo = '{FFFFF66453';
    
    console.log(`Manually linking Dog UID: ${dogUid} to DongtaeNo: ${dongtaeNo}...`);
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'update_record',
            table: 'dogTab',
            data: {
                uid: dogUid,
                dongtae_no: dongtaeNo
            }
        })
    });
    const result = await res.json();
    console.log("Result:", result);
}
repairKJC00001().catch(console.error);
