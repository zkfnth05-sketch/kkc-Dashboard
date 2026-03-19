
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function finalInvestigate() {
    const dogUid = '544961'; // KJ-C00001
    
    // 1. dogTab에서 실제 dongtae_no 값 확인
    const resDog = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dogTab',
            search: dogUid,
            field: 'uid',
            limit: 1
        })
    });
    const dogData = await resDog.json();
    const dog = dogData.data[0];
    console.log(`[DogTab] KJ-C00001 DongtaeNo: "${dog.dongtae_no}"`);

    // 2. 만약 dogTab에 번호가 있다면, dongtaeTab에 실제로 존재하는지 확인
    if (dog.dongtae_no) {
        const resDT = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'get_dongtae_info',
                dongtae_no: dog.dongtae_no
            })
        });
        const dtData = await resDT.json();
        console.log(`[DongtaeTab] Fetch for "${dog.dongtae_no}" Success: ${dtData.success}`);
        if (dtData.data) {
            console.log("[DongtaeTab] Found Data:", JSON.stringify(dtData.data));
        } else {
            console.log("[DongtaeTab] No record found for this number in dongtaeTab.");
        }
    }
}
finalInvestigate().catch(console.error);
