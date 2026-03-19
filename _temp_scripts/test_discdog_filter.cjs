
const url = 'https://kkc3349.mycafe24.com/bridg.php';
const key = 'kkc-super-secret-key-change-this-now-12345!';

async function testFilter() {
    console.log('--- Testing "디스크독" tab filter (Legacy Events) ---');
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': key
            },
            body: JSON.stringify({
                mode: 'list',
                table: 'legacy_events',
                category: '디스크독'
            })
        });
        const data = await res.json();
        console.log(`Total: ${data.total || 0}`);
        if (data.data) {
            data.data.forEach(item => {
                console.log(`- [${item.id}] ${item.title} (Cat: ${item.category}, Original: ${item.type_names})`);
            });
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testFilter();
