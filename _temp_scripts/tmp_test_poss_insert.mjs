
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testInsert() {
    const payload = {
        mode: 'create_record',
        table: 'poss_changeTab',
        data: {
            dog_uid: "544231", // Example from Step 80
            reg_no: "KSZ-C50028",
            poss_id: "test_id",
            poss_name: "테스트",
            poss_name_eng: "Test",
            poss_addr: "서울시 강남구",
            poss_phone: "010-1234-5678",
            change_date: "2026-03-15",
            sign_date: "2026-03-15"
        }
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.log(`Fetch Error - ${e.message}`);
    }
}

testInsert();
