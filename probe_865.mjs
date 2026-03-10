import https from 'https';

const BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

function probe() {
    const data = JSON.stringify({
        mode: 'list',
        table: 'legacy_events',
        search: '865',
        field: 'id'
    });

    const options = {
        hostname: 'kkc3349.mycafe24.com',
        path: '/bridg.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': SECRET_KEY,
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                if (parsed.data && parsed.data.length > 0) {
                    console.log(JSON.stringify(parsed.data[0], null, 2));
                } else {
                    console.log("Not found or empty data");
                }
            } catch (e) {
                console.log("Error parsing response:", body);
            }
        });
    });

    req.on('error', (e) => console.error(e));
    req.write(data);
    req.end();
}

probe();
