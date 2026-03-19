
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function deepAudit() {
    const regNo = 'KJ-C00001';
    console.log(`--- Auditing Dog: ${regNo} ---`);
    
    // 1. 강아지 정보 (dogTab)
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
    if (!dogList.data || dogList.data.length === 0) {
        console.log("Dog KJ-C00001 not found.");
        return;
    }
    const dog = dogList.data[0];
    console.log(`Dog UID: ${dog.uid}, Name: ${dog.name}, DongtaeNo: [${dog.dongtae_no}]`);

    // 2. 동태 정보 전체 조회 (최근 10건) - 혹시 비슷한 번호가 있는지 확인
    console.log(`\n--- Recent Dongtae Records (dongtaeTab) ---`);
    const resDT = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'dongtaeTab',
            limit: 10,
            order: 'uid DESC'
        })
    });
    const dtList = await resDT.json();
    dtList.data.forEach(d => {
        console.log(`DT No: [${d.dongtae_no}], Memo: ${d.memo}, UID: ${d.uid}`);
    });

    // 3. 강아지의 DongtaeNo로 직접 조회 시도
    if (dog.dongtae_no && dog.dongtae_no !== 'null') {
        process.stdout.write(`\nFetching Info for Dog's DongtaeNo [${dog.dongtae_no}]... `);
        const resInfo = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'get_dongtae_info',
                dongtae_no: dog.dongtae_no
            })
        });
        const info = await resInfo.json();
        console.log(info.success ? "Success" : "Failed");
        if(info.data) console.log("Data Found:", JSON.stringify(info.data));
    }
}
deepAudit().catch(console.error);
