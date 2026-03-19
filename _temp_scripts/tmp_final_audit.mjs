
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function finalAudit() {
    const regNo = 'KJ-C00001';
    console.log(`--- Investigating KJ-C00001 ---`);
    
    // 1. Get Dog Info
    const resDog = await fetch(BRIDGE_URL, {
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
    const dogList = await resDog.json();
    const dog = dogList.data[0];
    console.log(`Step 1: Dog Record -> UID: ${dog.uid}, DongtaeNo: [${dog.dongtae_no}]`);

    // 2. Fetch Dongtae Info using the exact mode the app uses
    if (dog.dongtae_no) {
        console.log(`Step 2: Fetching Dongtae Info for [${dog.dongtae_no}]...`);
        const resDT = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'get_dongtae_info',
                dongtae_no: dog.dongtae_no
            })
        });
        const dtResult = await resDT.json();
        console.log(`Success: ${dtResult.success}`);
        if (dtResult.data) {
            console.log("Data Received:", JSON.stringify(dtResult.data));
        } else {
            console.log("Error/No Data:", dtResult.error || "No record found");
        }
    } else {
        console.log("Dog has no dongtae_no.");
    }
}
finalAudit().catch(console.error);
