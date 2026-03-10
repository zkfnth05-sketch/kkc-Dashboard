const fetch = require('node-fetch');

async function test() {
    try {
        const payload = {
            mode: 'execute_sql',
            queries: [
                "UPDATE `memTab` SET `id` = 's02904', `name` = '이덕윤', `end_date` = '0000-00-00', `saho_reg_date` = '0000-00-00', `pro_class` = 'TR5-TR2-TR3-aad-CD-LKJ-CBC-com' WHERE `mid` = 255399"
            ]
        };
        const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
            },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
