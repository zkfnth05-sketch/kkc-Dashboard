
async function checkAll() {
    try {
        const payload = {
            mode: 'list',
            table: 'wp_posts',
            category: '전체',
            limit: 500
        };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!' }
        });
        const json = await res.json();

        console.log("Total events received:", json.data ? json.data.length : 0);
        if (json.data) {
            const specific = json.data.filter(e => e.startDate === '2026-03-20' || e.startDate === '2026-03-21');
            console.log("Events found for 2026-03-20 to 2026-03-21:");
            console.log(JSON.stringify(specific.map(e => ({
                id: e.id,
                title: e.title,
                startDate: e.startDate,
                startTime: e.startTime,
                venue: e.venue,
                source: e.source
            })), null, 2));
        } else {
            console.log("Error or No data:", json.error);
        }

    } catch (e) {
        console.error(e);
    }
}
checkAll();
