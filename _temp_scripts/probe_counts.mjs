
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    const payload = {
        mode: 'list',
        table: 'legacy_events',
        category: '전체'
    };
    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.data) {
            console.log('--- Event Data Sample (ID, Title, Category, Count) ---');
            data.data.slice(0, 30).forEach(e => {
                console.log("[" + e.id + "] " + e.category + " | " + e.title + " | Count: " + e.applicant_count);
            });
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}
probe();
