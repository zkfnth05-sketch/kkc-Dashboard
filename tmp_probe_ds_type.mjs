
async function probeDsType() {
    const SECRET = 'kkc-super-secret-key-change-this-now-12345!';
    const URL = 'https://kkc3349.mycafe24.com/bridg.php';

    const tables = ['dogshow', 'stylist', 'sports_event', 'seminar', 'breed_exam'];

    for (const table of tables) {
        console.log(`\n--- Table: ${table} ---`);
        try {
            const res = await fetch(URL, {
                method: 'POST',
                body: JSON.stringify({ mode: 'list', table: table, limit: 100 }),
                headers: { 'X-Auth-Token': SECRET }
            });
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                const types = [...new Set(json.data.map(d => d.ds_type || '(EMPTY)'))];
                console.log("Distinct ds_type values found:", types);
                console.log("Samples:", json.data.slice(0, 3).map(d => ({ title: d.ds_name, ds_type: d.ds_type })));
            } else {
                console.log("No data or error:", json.error || "Empty list");
            }
        } catch (e) {
            console.error(`Error probing ${table}:`, e.message);
        }
    }
}
probeDsType();
