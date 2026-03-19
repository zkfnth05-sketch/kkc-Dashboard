
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function runMigration() {
    const payload = {
        mode: 'execute_sql',
        queries: [
            "ALTER TABLE dogshow ADD COLUMN IF NOT EXISTS ds_organizer VARCHAR(255) DEFAULT '(사)한국애견협회' AFTER ds_place",
            "ALTER TABLE stylist ADD COLUMN IF NOT EXISTS ds_organizer VARCHAR(255) DEFAULT '(사)한국애견협회' AFTER ds_place"
        ]
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
        console.log("✅ Migration Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

runMigration();
