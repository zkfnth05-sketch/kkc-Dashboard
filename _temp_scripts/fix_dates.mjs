async function fix_dates() {
    try {
        const payload = {
            mode: 'execute_sql',
            queries: [
                "UPDATE dogshow SET ds_date = '2024-03-07' WHERE ds_date = '0000-00-00' AND ds_pid IN (832, 833)"
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
fix_dates();
