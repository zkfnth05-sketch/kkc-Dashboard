
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkApplicantData() {
    console.log("--- Checking applicants for '도그쇼 1' ---");
    const payload = {
        mode: 'execute_sql',
        queries: [
            `SELECT name, pedigree_number, LENGTH(pedigree_number) as len FROM dogshow_applicant WHERE title LIKE '%도그쇼 1%'`
        ]
    };

    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        // execute_sql은 결과를 안 주므로 mode: list로 다시 시도
        const listPayload = {
            mode: 'list',
            table: 'dogshow_applicant',
            search: '도그쇼 1',
            field: 'title',
            limit: 10
        };
        const lRes = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(listPayload)
        });
        const lData = await lRes.json();
        
        if (lData.data) {
            lData.data.forEach(a => {
                console.log(`Name: [${a.name}], RegNo: [${a.pedigree_number}], Length: ${a.pedigree_number?.length}`);
            });
        } else {
            console.log("No applicant data found.");
        }
    } catch (e) {
        console.error(`Fetch Error:`, e.message);
    }
}

checkApplicantData();
