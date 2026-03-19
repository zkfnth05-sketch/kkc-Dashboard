// Use built-in fetch

async function run() {
    const queries = [
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `birthdate` VARCHAR(20) DEFAULT NULL COMMENT '생년월일'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `email` VARCHAR(100) DEFAULT NULL COMMENT '이메일'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL COMMENT '주소'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `affiliation` VARCHAR(100) DEFAULT NULL COMMENT '소속'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `dog_breed` VARCHAR(100) DEFAULT NULL COMMENT '모종'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `entry_type` VARCHAR(100) DEFAULT NULL COMMENT '참가유형'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `entry_category` VARCHAR(100) DEFAULT NULL COMMENT '종목'",
        "ALTER TABLE `dogshow_applicant` ADD COLUMN `student_id_photo` VARCHAR(500) DEFAULT NULL COMMENT '학생증 사진 URL'"
    ];

    for (const sql of queries) {
        try {
            const payload = {
                mode: 'execute_sql',
                queries: [sql]
            };
            const res = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            console.log(`Executed: ${sql}`);
            console.log(`Result:`, result);
        } catch (e) {
            console.error(`Failed: ${sql}`, e.message);
        }
    }
}

run();
