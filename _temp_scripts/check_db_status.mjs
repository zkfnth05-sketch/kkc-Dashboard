
const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

async function checkColumns() {
    console.log("🔍 Checking dogshow table columns...");
    const payload = {
        mode: 'execute_sql',
        queries: ["SHOW COLUMNS FROM dogshow"]
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

        // 참고: execute_sql은 query()를 쓰므로 결과를 리턴하지 않을 수 있습니다. 
        // 대신 list 모드로 우회해서 확인해보겠습니다.
        console.log("Column check initiated.");
    } catch (e) {
        console.error(e);
    }
}
checkColumns();
