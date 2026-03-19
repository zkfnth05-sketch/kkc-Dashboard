
// Native fetch available in Node.js 18+

const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkAgilityDB() {
    console.log('--- Checking agility_applicant schema & data ---');
    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'X-Auth-Token': SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: 'list',
                table: 'agility_applicant'
            })
        });
        const result = await res.json();
        if (result.success) {
            console.log('Sample Data:');
            console.table(result.data.slice(0, 5).map(row => ({
                id: row.id,
                name: row.name,
                subject: row.subject,
                size: row.size,
                division: row.division
            })));

            const sizes = [...new Set(result.data.map(r => r.size))];
            const divisions = [...new Set(result.data.map(r => r.division))];
            const subjects = [...new Set(result.data.map(r => r.subject))];

            console.log('\nActual values found in DB:');
            console.log('Sizes:', sizes);
            console.log('Divisions:', divisions);
            console.log('Subjects:', subjects);
        } else {
            console.error('Error fetching data:', result.error);
        }

    } catch (e) {
        console.error('Connection error:', e.message);
    }
}

checkAgilityDB();
