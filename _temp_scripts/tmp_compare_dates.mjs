
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function inspect() {
    const ids = ['544146', '544147']; // Conan and one of the children (BUNNY UID might be 544147)
    // Actually I should find BUNNY's UID first.
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({ mode: 'list', table: 'dogTab', search: 'BUNNY', field: 'name', limit: 1 })
    });
    const json = await res.json();
    const bunny = json.data[0];
    
    // Fetch Conan
    const res2 = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({ mode: 'list', table: 'dogTab', search: '544146', field: 'uid', limit: 1 })
    });
    const json2 = await res2.json();
    const conan = json2.data[0];

    console.log(`Conan (Father): UID=${conan.uid}, DNo=${conan.dongtae_no}, SignDate=${conan.sign_date}`);
    console.log(`Bunny (Child): UID=${bunny.uid}, DNo=${bunny.dongtae_no}, SignDate=${bunny.sign_date}`);
}
inspect().catch(console.error);
