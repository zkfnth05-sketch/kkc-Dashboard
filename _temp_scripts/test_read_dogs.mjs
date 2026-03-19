async function test_read() {
    try {
        const payload = {
            mode: 'execute_sql',
            queries: [
                "SELECT ds_pid, HEX(ds_type) as hex_type,HEX(ds_name) as hex_name, ds_date FROM dogshow ORDER BY ds_pid DESC LIMIT 5"
            ]
        };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
            },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
test_read();
