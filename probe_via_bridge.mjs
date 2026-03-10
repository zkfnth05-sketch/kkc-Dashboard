
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function probe() {
    const payload = {
        mode: 'execute_sql',
        queries: ["DESCRIBE dogshow"]
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

        // execute_sql doesn't return rows usually in current implementation, let's check
        const result = await response.json();
        console.log("✅ Response:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("❌ Error:", error);
    }
}
probe();
