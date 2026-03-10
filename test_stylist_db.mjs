async function testStylistApplicant() {
    const testData = {
        ds_pid: 9999, // 임시 태스트용 ID
        name: '태스트_홍길동',
        contact: '010-1234-5678',
        birthdate: '19900101',
        email: 'test@example.com',
        address: '서울시 강남구 테헤란로 123',
        affiliation: '테스트 아카데미',
        dog_breed: '위그',           // 드롭다운 항목 1
        entry_type: 'Level B',      // 드롭다운 항목 2
        entry_category: '(Level B)-더치클립', // 드롭다운 항목 3
        payment_status: '미입금'
    };

    console.log("--- [STEP 1] 신규 신청자 생성 테스트 ---");
    try {
        const createRes = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
            },
            body: JSON.stringify({
                mode: 'create_record',
                table: 'stylist_applicant',
                data: testData
            })
        }).then(r => r.json());

        console.log("생성 결과:", createRes);

        if (createRes.success) {
            const newId = createRes.id;
            console.log(`\n--- [STEP 2] 생성된 데이터 검증 (ID: ${newId}) ---`);

            const listRes = await fetch('https://kkc3349.mycafe24.com/bridg.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
                },
                body: JSON.stringify({
                    mode: 'list',
                    table: 'stylist_applicant',
                    search: newId.toString(),
                    field: 'id'
                })
            }).then(r => r.json());

            const savedData = listRes.data?.[0];
            if (savedData) {
                console.log("DB 저장값 확인:");
                console.log(`- 모종: ${savedData.dog_breed} (기대값: 위그)`);
                console.log(`- 참가유형: ${savedData.entry_type} (기대값: Level B)`);
                console.log(`- 종목: ${savedData.entry_category} (기대값: (Level B)-더치클립)`);

                const isMatch = savedData.dog_breed === '위그' &&
                    savedData.entry_type === 'Level B' &&
                    savedData.entry_category === '(Level B)-더치클립';

                console.log("\n최종 결과:", isMatch ? "✅ 데이터가 DB에 정확히 기록되었습니다." : "❌ 데이터 불일치 발생!");
            }

            // 테스트 데이터 삭제
            await fetch('https://kkc3349.mycafe24.com/bridg.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
                },
                body: JSON.stringify({
                    mode: 'delete_record',
                    table: 'stylist_applicant',
                    id: newId
                })
            });
            console.log("\n--- [STEP 3] 테스트 데이터 정리 완료 ---");
        }
    } catch (e) {
        console.error("테스트 실패:", e.message);
    }
}

testStylistApplicant();
