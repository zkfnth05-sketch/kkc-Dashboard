const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspectHenry() {
    try {
        const hPayload = {
            mode: 'list',
            table: 'poss_changeTab',
            search: '547062',
            field: 'dog_uid',
            exact: true,
            limit: 10
        };
        const hRes = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(hPayload)
        });
        const hData = await hRes.json();
        console.log("Owner History for D-Henry (547062):", JSON.stringify(hData.data || hData, null, 2));
    } catch (e) {
        console.log(`Fetch Error - ${e.message}`);
    }
}

inspectHenry();
