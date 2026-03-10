
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';
async function probe() {
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'list',
            table: 'wp_posts',
            category: '전체',
            limit: 100
        })
    });
    const json = await res.json();
    const matches = json.data.filter(e => e.startDate >= '2026-03-27' && e.startDate <= '2026-03-31');
    console.log("Matches from API:", JSON.stringify(matches, null, 2));
}
probe().catch(console.error);
