
async function checkRaw() {
    try {
        const payload = { mode: 'list', table: 'wp_posts', category: '전체', limit: 100 };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST', body: JSON.stringify(payload),
            headers: { 'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!' }
        });
        const json = await res.json();
        const target = json.data.find(e => e.id === 'ds_850');
        console.log("Raw Event ds_850:", JSON.stringify(target, null, 2));
    } catch (e) { console.error(e); }
}
checkRaw();
