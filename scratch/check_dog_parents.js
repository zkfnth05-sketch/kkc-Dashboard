
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkDogData() {
    const regNos = ['MIX-C00001', 'fddffd'];
    console.log(`--- Checking dog data for ${regNos.join(', ')} ---`);
    const payload = {
        mode: 'execute_sql',
        queries: [
            `SELECT uid, reg_no, name, fa_regno, mo_regno, sire_name_text, dam_name_text FROM dogTab WHERE reg_no IN ('MIX-C00001', 'fddffd')`
        ]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.results && data.results[0]) {
            console.log(JSON.stringify(data.results[0], null, 2));
            
            // 만약 fa_regno가 있다면 그 데이터도 확인
            const firstDog = data.results[0][0];
            if (firstDog && firstDog.fa_regno && firstDog.fa_regno !== '0') {
                console.log(`\n--- Checking parent (fa_regno: ${firstDog.fa_regno}) ---`);
                const parentPayload = {
                    mode: 'execute_sql',
                    queries: [`SELECT uid, reg_no, name FROM dogTab WHERE uid = '${firstDog.fa_regno}' OR reg_no = '${firstDog.fa_regno}'`]
                };
                const pRes = await fetch(BRIDGE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                    body: JSON.stringify(parentPayload)
                });
                const pData = await pRes.json();
                console.log("Parent result:", JSON.stringify(pData.results[0], null, 2));
            }
        } else {
            console.log("No data found or Error:", data);
        }
    } catch (e) {
        console.error(`Fetch Error:`, e.message);
    }
}

checkDogData();
