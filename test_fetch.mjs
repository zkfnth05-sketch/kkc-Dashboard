async function test_read() {
    try {
        const payload = {
            mode: 'execute_sql',
            queries: [
                "SELECT ID, post_title, post_type, post_status, post_date FROM wp_posts ORDER BY ID DESC LIMIT 5"
            ]
        };
        // Again, execute_sql won't work for reading.
        // I'll use kkc_handle_get_events_list with a search for 'rd'.
        const payloadList = {
            mode: 'list',
            table: 'wp_posts',
            search: 'rd',
            category: '전체'
        };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            body: JSON.stringify(payloadList),
            headers: { 'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!' }
        });
        const json = await res.json();
        console.log("Search 'rd' Results:", JSON.stringify(json.data.map(d => ({ id: d.id, title: d.title, source: d.source })), null, 2));

    } catch (e) {
        console.error(e);
    }
}
test_read();
