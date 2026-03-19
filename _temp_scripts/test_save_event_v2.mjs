
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testSaveEvent() {
    console.log("🚀 Testing Save Event with Registration Dates...");

    const payload = {
        mode: 'save_event',
        data: {
            category: '도그쇼',
            title: '테스트 대회 - ' + new Date().toISOString(),
            subtitle: '부제목 테스트',
            venue: '서울 양재 AT센터',
            startDate: '2026-05-01',
            startTime: '09:30',
            endDate: '2026-05-03',
            endTime: '17:30',
            reg_start_date: '2026-04-01',
            reg_start_h: '10',
            reg_start_m: '00',
            reg_end_date: '2026-04-20',
            reg_end_h: '18',
            reg_end_m: '30',
            is_multi_day: 1,
            judges: '심사위원 A, 심사위원 B',
            content: '<p>테스트 대회 내용입니다.</p>'
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
        console.log("✅ Save Response:", JSON.stringify(result, null, 2));

        if (result.success && result.id) {
            console.log("🔍 Verifying newly saved event...", result.id);
            const listPayload = {
                mode: 'list',
                table: 'legacy_events',
                search: payload.data.title,
                category: '도그쇼'
            };

            const listResponse = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': SECRET_KEY
                },
                body: JSON.stringify(listPayload)
            });

            const listResult = await listResponse.json();
            const savedEvent = listResult.data.find(e => e.id === result.id);

            if (savedEvent) {
                console.log("✨ Verified Fields in DB:");
                console.log("- Title:", savedEvent.title);
                console.log("- Start Date:", savedEvent.startDate);
                console.log("- End Date:", savedEvent.endDate);
                console.log("- Reg Start Date:", savedEvent.reg_start_date);
                console.log("- Reg End Date:", savedEvent.reg_end_date);
                console.log("- Reg Start H:", savedEvent.reg_start_h);
                console.log("- Reg End H:", savedEvent.reg_end_h);

                const ok = savedEvent.endDate === '2026-05-03' &&
                    savedEvent.reg_start_date === '2026-04-01' &&
                    savedEvent.reg_end_date === '2026-04-20';

                if (ok) {
                    console.log("\n🎊 SUCCESS! All fields correctly stored.");
                } else {
                    console.log("\n❌ FAIL! Field mismatch detected.");
                }
            } else {
                console.log("❌ Could not find the saved event in the list.");
            }
        }
    } catch (error) {
        console.error("❌ Error during test:", error);
    }
}

testSaveEvent();
