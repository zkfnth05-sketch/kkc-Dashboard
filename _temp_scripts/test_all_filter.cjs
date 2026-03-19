
const url = 'https://kkc3349.mycafe24.com/bridg.php';
const key = 'kkc-super-secret-key-change-this-now-12345!';

async function testFilter() {
    console.log('--- Testing "전체" filter ---');
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
                category: '전체'
            })
        });
        const data = await res.json();
        console.log(`Total: ${data.total || 0}`);
        if (data.data) {
            const item864 = data.data.find(d => d.id === 'ds_864');
            if (item864) {
                console.log(`Found 864: ${JSON.stringify(item864)}`);
            } else {
                console.log('864 NOT found in "전체" list');
                // List first 5
                data.data.slice(0, 5).forEach(d => console.log(`- ${d.id}: ${d.title} (${d.type_names})`));
            }
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testFilter();
