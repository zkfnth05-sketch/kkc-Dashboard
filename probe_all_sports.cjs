
const url = 'https://kkc3349.mycafe24.com/bridg.php';
const key = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    console.log('--- Listing ALL events from sports_event ---');
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': key
            },
            body: JSON.stringify({
                mode: 'list',
                table: 'sports_event',
                limit: 50
            })
        });
        const data = await res.json();
        console.log(`Total: ${data.total || 0}`);
        if (data.data) {
            data.data.forEach(item => {
                console.log(`- [${item.ds_pid}] ${item.ds_name} (Date: ${item.ds_date}, Type: ${item.ds_type})`);
            });
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

probe();
