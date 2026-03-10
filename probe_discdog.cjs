
const url = 'https://kkc3349.mycafe24.com/bridg.php';
const key = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    const tables = ['dogshow', 'sports_event', 'stylist', 'seminar', 'breed_exam'];
    console.log('--- Probing Disc Dog events across tables ---');

    for (const table of tables) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': key
                },
                body: JSON.stringify({
                    mode: 'list',
                    table: table,
                    search: '디크스독', // Typing mistake fixed below
                    limit: 10
                })
            });
            const data = await res.json();

            // Search with '디스크독' (correct spelling)
            const res2 = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': key
                },
                body: JSON.stringify({
                    mode: 'list',
                    table: table,
                    search: '디스크독',
                    limit: 10
                })
            });
            const data2 = await res2.json();

            const combinedTotal = (data.total || 0) + (data2.total || 0);
            const combinedData = [...(data.data || []), ...(data2.data || [])];

            console.log(`Table: ${table}, Count: ${combinedTotal}`);
            if (combinedData.length > 0) {
                combinedData.forEach(item => {
                    console.log(`  - [${item.ds_pid || item.id}] ${item.ds_name || item.title} (Type: ${item.ds_type || 'N/A'})`);
                });
            }
        } catch (e) {
            console.log(`Table: ${table}, Error: ${e.message}`);
        }
    }
}

probe();
