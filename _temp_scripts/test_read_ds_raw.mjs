async function test_read() {
    try {
        const payload = {
            mode: 'list',
            table: 'dogshow',
            page: 1,
            limit: 5 // Get newest ones
        };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
            },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        console.log("Raw dogshow table records:");
        console.log(JSON.stringify(json.data.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e);
    }
}
test_read();
