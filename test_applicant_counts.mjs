
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testCounts() {
    const categories = [
        { name: '도그쇼', applicantTable: 'dogshow_applicant' },
        { name: '신청자 일반(훈련)', applicantTable: 'sports_applicant' },
        { name: '어질리티', applicantTable: 'agility_applicant' },
        { name: '디스크독', applicantTable: 'discdog_applicant' },
        { name: '플라이볼', applicantTable: 'flyball_applicant' },
        { name: '세미나', applicantTable: 'seminar_applicant' },
        { name: '스타일리스트', applicantTable: 'stylist_applicant' }
    ];

    for (const cat of categories) {
        const payload = {
            mode: 'execute_sql',
            queries: [
                `SELECT COUNT(*) as cnt FROM ${cat.applicantTable}`
            ]
        };

        try {
            const res = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success && data.results && data.results[0]) {
                const count = data.results[0][0]?.cnt || 0;
                console.log(`[${cat.name}] ${cat.applicantTable}: ${count} rows`);
            } else {
                console.log(`[${cat.name}] ${cat.applicantTable}: Error - ${JSON.stringify(data)}`);
            }
        } catch (e) {
            console.log(`[${cat.name}] ${cat.applicantTable}: Fetch Error - ${e.message}`);
        }
    }
}

testCounts();
