
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkApplicants() {
    const categories = [
        { name: '도그쇼', table: 'dogshow_applicant' },
        { name: '스타일리스트', table: 'stylist_applicant' },
        { name: '훈련', table: 'sports_applicant' },
        { name: '어질리티', table: 'agility_applicant' },
        { name: '디스크독', table: 'discdog_applicant' },
        { name: '플라이볼', table: 'flyball_applicant' },
        { name: '세미나', table: 'seminar_applicant' }
    ];

    for (const cat of categories) {
        const payload = {
            mode: 'list',
            table: cat.table,
            limit: 10
        };
        try {
            const res = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            console.log("Table " + cat.table + ": " + (data.data ? data.data.length + " rows (sample ds_pid: " + (data.data[0]?.ds_pid || 'none') + ")" : "0 rows or error"));
        } catch (e) {
            console.log("Error " + cat.table + ": " + e.message);
        }
    }
}
checkApplicants();
