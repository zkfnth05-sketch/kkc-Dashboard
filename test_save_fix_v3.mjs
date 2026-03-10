
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testFinalSaveFix() {
    console.log("🚀 Testing Save with verified payload...");

    const payload = {
        mode: 'save_event',
        data: {
            category: '도그쇼',
            title: '최종 필드 테스트 V3',
            venue: '서울 양재',
            organizer: '주최자 소속 명칭 테스트',
            judges: '심사위원 목록 홍길동',
            startDate: '2026-07-01',
            startTime: '10:00',
            endDate: '2026-07-01',
            endTime: '18:00',
            reg_start_date: '2026-06-01',
            reg_end_date: '2026-06-10'
        }
    };

    try {
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("✅ result:", result);

        if (result.success) {
            console.log("🔍 Checking if it actually saved in the list...");
            const listPayload = {
                mode: 'list',
                table: 'legacy_events',
                search: '최종 필드 테스트 V3',
                category: '도그쇼'
            };

            const lRes = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
                body: JSON.stringify(listPayload)
            });

            const lData = await lRes.json();
            const item = (lData.data || []).find(d => d.id === result.id);

            if (item) {
                console.log("✨ Data returned from server:");
                console.log("- organizer:", item.organizer);
                console.log("- judges:", item.judges);
                console.log("- ds_etc:", item.ds_etc);
            } else {
                console.log("❌ Item not found in list.");
            }
        }
    } catch (e) { console.error("❌", e); }
}

testFinalSaveFix();
