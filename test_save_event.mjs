
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testSaveEvent() {
    console.log("🚀 Testing Save Event to Legacy Tables...");

    const payload = {
        mode: 'save_event',
        data: {
            category: '훈련 경기대회',
            title: 'ㄱㄹㄷㄱㄷ',
            venue: 'ㄷㄱㄷㄱ',
            startDate: '2026-03-18',
            endDate: '2026-03-26',
            startTime: '10:00',
            endTime: '18:00',
            is_multi_day: 0,
            judges: 'ㄱㄷㄱㄷ'
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
        console.log("✅ Response:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testSaveEvent();
