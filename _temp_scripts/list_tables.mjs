
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkTables() {
    const payload = { mode: 'get_all_tables' };
    const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    const tables = data.data;
    console.log('seminar' in tables || tables.includes('seminar'));
    console.log('seminar_applicant' in tables || tables.includes('seminar_applicant'));
    console.log('sports_event' in tables || tables.includes('sports_event'));
    console.log('stylist' in tables || tables.includes('stylist'));
    console.log('stylist_applicant' in tables || tables.includes('stylist_applicant'));
    console.log('sports_applicant' in tables || tables.includes('sports_applicant'));

    const search = ['seminar', 'sports', 'stylist', 'agility', 'discdog', 'flyball', 'breed_exam'];
    search.forEach(s => {
        console.log(`Searching for ${s}:`, tables.filter(t => t.toLowerCase().includes(s)));
    });
}
checkTables();
