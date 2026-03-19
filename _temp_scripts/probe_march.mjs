
async function checkAll() {
    try {
        const payload = { mode: 'list', table: 'wp_posts', category: '전체', limit: 100 };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST', body: JSON.stringify(payload),
            headers: { 'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!' }
        });
        const json = await res.json();

        const filterDate = '2026-03';
        const matches = json.data.filter(e => e.startDate && e.startDate.startsWith(filterDate));
        console.log(`Found ${matches.length} events in ${filterDate}`);
        console.log(JSON.stringify(matches.map(e => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            startTime: e.startTime,
            venue: e.venue,
            organizer: e.organizer,
            source: e.source
        })), null, 2));

    } catch (e) { console.error(e); }
}
checkAll();
