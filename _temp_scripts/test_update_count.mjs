
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testUpdate() {
    console.log('--- Testing Applicant Count Update ---');

    const ds_pid = 866; // 세미나
    const table = 'seminar_applicant';

    // 1. Add applicant
    const addPayload = {
        mode: 'create_record',
        table: table,
        data: {
            ds_pid: ds_pid,
            name: 'Test Applicant',
            contact: '010-0000-0000',
            payment_status: '미입금'
        }
    };

    try {
        console.log('Adding test applicant to seminar_applicant for ds_pid 866...');
        const addRes = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(addPayload)
        });
        const addData = await addRes.json();
        console.log('Add Result:', addData.success ? 'Success' : 'Fail');

        // 2. Fetch event list and check count
        const listPayload = {
            mode: 'list',
            table: 'legacy_events',
            category: '전체'
        };
        const listRes = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(listPayload)
        });
        const listData = await listRes.json();
        const event = listData.data.find(e => e.id === 'ds_866');
        console.log('Event ds_866 Count:', event ? event.applicant_count : 'Not Found');

        // 3. Cleanup
        const cleanupPayload = {
            mode: 'execute_sql',
            queries: ["DELETE FROM seminar_applicant WHERE ds_pid = 866 AND name = 'Test Applicant'"]
        };
        await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(cleanupPayload)
        });
        console.log('Cleanup done.');

    } catch (e) {
        console.log('Error:', e.message);
    }
}

testUpdate();
