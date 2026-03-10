
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testSaveFullFields() {
    console.log("🚀 Testing Save Organizer and Judges...");

    const payload = {
        mode: 'save_event',
        data: {
            category: '도그쇼',
            title: '필드 저장 테스트 - ' + new Date().toISOString(),
            venue: '서울 강남구 신사동',
            organizer: '주최자 테스트 소속',
            judges: '홍길동, 임꺽정',
            startDate: '2026-06-01',
            startTime: '10:00',
            endDate: '2026-06-02',
            endTime: '18:00',
            reg_start_date: '2026-05-01',
            reg_end_date: '2026-05-15'
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
        console.log("✅ Save Result:", result);

        if (result.success) {
            console.log("🔍 Fetching back to verify...");
            const listPayload = {
                mode: 'list',
                table: 'legacy_events',
                search: payload.data.title,
                category: '도그쇼'
            };

            const listRes = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': SECRET_KEY
                },
                body: JSON.stringify(listPayload)
            });

            const listData = await listRes.json();
            const savedItem = listData.data.find(d => d.id === result.id);

            if (savedItem) {
                console.log("📋 Verified Fields:");
                console.log("- Title:", savedItem.title);
                console.log("- Organizer:", savedItem.organizer);
                console.log("- Judges:", savedItem.judges);

                const ok = savedItem.organizer === '주최자 테스트 소속' && savedItem.judges === '홍길동, 임꺽정';
                if (ok) console.log("🎊 VERIFICATION SUCCESS!");
                else console.log("❌ VERIFICATION FAIL! Fields mismatch.");
            } else {
                console.log("❌ Could not find saved item in list.");
            }
        }
    } catch (e) {
        console.error("❌ Test Error:", e);
    }
}

testSaveFullFields();
