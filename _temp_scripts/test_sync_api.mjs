// Using native fetch in Node.js 18+

const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function testSync() {
    console.log("🚀 Starting Sync Test...");

    const testTitle = "SYNC_TEST_" + Date.now();
    const testVenue = "TEST_VENUE_" + Math.floor(Math.random() * 1000);

    // 1. Save Event (Competition Management Style)
    console.log(`📝 1. Creating test event: ${testTitle}`);
    const savePayload = {
        mode: 'update_record',
        table: 'wp_posts',
        data: {
            post_type: 'kkf_event',
            post_title: testTitle,
            post_content: "Test Content",
            event_start_datetime: "2026-03-25 11:45:00",
            event_end_datetime: "2026-03-26 17:15:00",
            event_venue: testVenue,
            event_organizer: "Test Organizer",
            type_names: "진도견 선발대회",
            is_multi_day: true
        }
    };

    const saveRes = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': SECRET_KEY
        },
        body: JSON.stringify(savePayload)
    });

    const saveData = await saveRes.json();
    if (!saveData.success) {
        console.error("❌ Save Failed:", saveData);
        process.exit(1);
    }
    console.log("✅ Save Success. ID:", saveData.id);

    // 2. Fetch Events List (Event Management Style)
    console.log("🔍 2. Fetching events list to verify sync...");
    const listPayload = {
        mode: 'list',
        table: 'wp_posts',
        category: '진도견 선발대회'
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
    if (!listData.success) {
        console.error("❌ List Fetch Failed:", listData);
        process.exit(1);
    }

    const found = listData.data.find(e => e.title === testTitle);
    if (!found) {
        console.error("❌ Created event not found in list!");
        process.exit(1);
    }

    console.log("-----------------------------------------");
    console.log("📊 SYNC VERIFICATION RESULTS:");
    console.log("-----------------------------------------");
    console.log("Expected Venue:", testVenue);
    console.log("Actual Venue:  ", found.venue);
    console.log("Expected Start:", "11:45");
    console.log("Actual Start: ", found.startTime);
    console.log("Expected End:  ", "17:15");
    console.log("Actual End:   ", found.endTime);
    console.log("-----------------------------------------");

    if (found.venue === testVenue && found.startTime === '11:45' && found.endTime === '17:15') {
        console.log("✨ SUCCESS: Legacy Table Data is 100% Synchronized!");
    } else {
        console.error("❌ FAILURE: Legacy Data Mismatch!");
        process.exit(1);
    }

    console.log("\n🌐 3. Testing WordPress (Standard) Post Sync...");
    const wpTitle = "WP_SYNC_TEST_" + Date.now();
    const wpVenue = "WP_VENUE_" + Math.floor(Math.random() * 1000);

    const wpSaveRes = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({
            mode: 'update_record',
            table: 'wp_posts',
            data: {
                post_type: 'kkf_event',
                post_title: wpTitle,
                event_start_datetime: "2026-03-27 09:30:00",
                event_end_datetime: "2026-03-28 18:45:00",
                event_venue: wpVenue,
                type_names: "기타"
            }
        })
    });
    const wpSaveData = await wpSaveRes.json();
    console.log("✅ WP Save Success. ID:", wpSaveData.id);

    const wpListRes = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': SECRET_KEY },
        body: JSON.stringify({ mode: 'list', table: 'wp_posts', category: '기타' })
    });
    const wpListData = await wpListRes.json();
    const wpFound = wpListData.data.find(e => e.title === wpTitle);

    console.log("📊 WP SYNC RESULTS:");
    console.log("Expected Venue:", wpVenue);
    console.log("Actual Venue:  ", wpFound?.venue);
    console.log("Expected Start:", "09:30");
    console.log("Actual Start: ", wpFound?.startTime);

    if (wpFound?.venue === wpVenue && wpFound?.startTime === '09:30') {
        console.log("✨ SUCCESS: WordPress Data is 100% Synchronized!");
    } else {
        console.error("❌ FAILURE: WordPress Data Mismatch!");
        process.exit(1);
    }
}

testSync().catch(console.error);
