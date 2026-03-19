
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function investigate() {
    const regNo = 'KJ-C00001';
    console.log(`Searching for dog with RegNo: ${regNo}...`);
    
    // 1. 강아지 정보 조회
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
    const dogData = await resDog.json();
    
    if (!dogData.data || dogData.data.length === 0) {
        console.log("Dog not found!");
        return;
    }
    
    const dog = dogData.data[0];
    console.log(`Dog found: ${dog.name} (UID: ${dog.uid})`);
    console.log(`DongtaeNo: ${dog.dongtae_no}`);
    console.log(`Sire UID: ${dog.fa_regno}, Dam UID: ${dog.mo_regno}`);
    
    if (dog.dongtae_no) {
        // 2. 동태 정보 조회
        const resDongtae = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'get_dongtae_info',
                dongtae_no: dog.dongtae_no
            })
        });
        const dongtaeData = await resDongtae.json();
        console.log("Dongtae Info:", dongtaeData.success ? "Loaded" : "Failed");
        if (dongtaeData.data) {
            console.log(`Dongtae Sire: ${dongtaeData.data.fa_reg_no}, Dam: ${dongtaeData.data.mo_reg_no}`);
        }
    }

    // 3. 부모견 UID로 직접 조회 테스트
    if (dog.fa_regno && dog.fa_regno !== '0') {
        const resSire = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify({
                mode: 'list',
                table: 'dogTab',
                search: dog.fa_regno,
                field: 'uid',
                limit: 1
            })
        });
        const sireData = await resSire.json();
        console.log(`Sire fetch status: ${sireData.success}, Count: ${sireData.data?.length}`);
        if (sireData.data?.[0]) console.log(`Sire Name: ${sireData.data[0].name}`);
    }
}
investigate().catch(console.error);
