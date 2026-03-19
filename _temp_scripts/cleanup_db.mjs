
// Native fetch
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function cleanupDb() {
    console.log("🛠️ Cleaning up '00:00' and '미지정' data in DB...");
    const queries = [
        "UPDATE dogshow SET ds_start_time = '10:00:00' WHERE ds_start_time = '00:00:00' OR ds_start_time IS NULL",
        "UPDATE dogshow SET ds_end_time = '18:00:00' WHERE ds_end_time = '00:00:00' OR ds_end_time IS NULL",
        "UPDATE stylist SET ds_start_time = '10:00:00' WHERE ds_start_time = '00:00:00' OR ds_start_time IS NULL",
        "UPDATE stylist SET ds_end_time = '18:00:00' WHERE ds_end_time = '00:00:00' OR ds_end_time IS NULL"
    ];

    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'execute_sql',
            queries
        })
    });
    const data = await res.json();
    console.log("✅ Cleanup Result:", data);
}

cleanupDb().catch(console.error);
