
async function checkEvents() {
    try {
        const payload = {
            mode: 'list',
            category: '전체',
            limit: 100
        };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!' }
        });
        const json = await res.json();

        // Find events on 2026-03-20
        const specificEvents = json.data.filter(e => e.startDate === '2026-03-20' || e.startDate === '2026-03-21');

        console.log("Events found for 2026-03-20 to 2026-03-21:");
        console.log(JSON.stringify(specificEvents.map(e => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            startTime: e.startTime,
            endTime: e.endTime,
            venue: e.venue,
            organizer: e.organizer,
            source: e.source
        })), null, 2));

    } catch (e) {
        console.error(e);
    }
}
checkEvents();
