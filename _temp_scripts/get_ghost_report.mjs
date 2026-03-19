
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkGhost() {
    try {
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': SECRET_KEY
            },
            body: JSON.stringify({
                mode: 'get_notices',
                limit: 1
            })
        });

        const data = await response.json();
        console.log("--- Ghost Report from Server ---");
        console.log("Debug Message:", data.debug_msg);
        console.log("-------------------------------");
    } catch (error) {
        console.error("Error fetching ghost report:", error);
    }
}

checkGhost();
