
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkPaymentStatus() {
    console.log("--- Checking payment_status for '도그쇼 1' applicants ---");
    const listPayload = {
        mode: 'list',
        table: 'dogshow_applicant',
        search: '도그쇼 1',
        field: 'title',
        limit: 10
    };
    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(listPayload)
        });
        const data = await res.json();
        if (data.data) {
            data.data.forEach(a => {
                console.log(`Name: [${a.name}], Status: [${a.payment_status}]`);
            });
        }
    } catch (e) {
        console.error(`Fetch Error:`, e.message);
    }
}

checkPaymentStatus();
