
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testSql() {
    const queries = [
        "SELECT ds_pid, ds_type FROM dogshow WHERE ds_pid = 866",
        "SELECT COUNT(*) as cnt FROM seminar_applicant WHERE ds_pid = 866",
        "SELECT d.ds_pid, (SELECT COUNT(*) FROM seminar_applicant WHERE ds_pid = d.ds_pid) as cnt FROM dogshow d WHERE d.ds_pid = 866"
    ];

    for (const sql of queries) {
        const payload = { mode: 'execute_sql', queries: [sql] };
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("SQL: " + sql);
        console.log("Result: " + JSON.stringify(data.results[0]));
    }
}
testSql();
