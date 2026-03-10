
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probeColumns() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': SECRET_KEY
        },
        body: JSON.stringify({
            mode: 'execute_sql',
            queries: ["SHOW COLUMNS FROM dogshow"]
        })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

probeColumns();
