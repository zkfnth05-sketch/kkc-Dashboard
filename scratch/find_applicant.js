
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function findApplicantByRegNo() {
    console.log("--- Finding applicant by pedigree_number: MIX-C00001 ---");
    const listPayload = {
        mode: 'list',
        table: 'dogshow_applicant',
        search: 'MIX-C00001',
        field: 'pedigree_number',
        limit: 1
    };
    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(listPayload)
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`Fetch Error:`, e.message);
    }
}

findApplicantByRegNo();
