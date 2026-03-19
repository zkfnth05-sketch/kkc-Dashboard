async function test() {
    try {
        const payload = {
            mode: 'execute_sql',
            queries: [
                "UPDATE `memTab` SET `id` = 's02904', `name` = '이덕윤', `name_eng` = '', `zumin` = '870808', `birth` = '--', `mem_degree` = 'C0', `zipcode` = '', `addr` = '대구광역시 남구 봉덕로 36 2층 매너독반려견교육센터', `addr_1` = '', `zipcode2` = '', `addr2` = '대구광역시 남구 봉덕로 36 2층 매너독반려견교육센터', `addr2_1` = '', `phone` = '--', `hp` = '010-6398-7788', `email` = 'ldy5858@naver.com', `pro_class` = 'TR5-TR2-TR3-aad-CD-LKJ-CBC-com', `memo` = 's02904 16.04.05 특별회원 매너독애견스쿨지정훈련소\r\n2016-037 3등훈련사 5.7시험\r\n2017-032 2급반려견지도사(3/18)\r\n2017-033 클리커자격증Master(12/15)\r\n2017-034 클리커자격증Starter(12/15)\r\n2017.12.23 반려견행동상담사1급 2017-026\r\n2018-057 동반견위촉장(18.8.14/20.8.13)\r\n주소변경 (전주소)대구광역시 동구 아양로 148\r\nKKC테이블.스마트독.반려견.가정견 심사위원 2019-055 7/12\r\n2023-42 베젠테스트 교육 (11/26)', `end_date` = '0000-00-00', `saho` = '', `saho_eng` = '', `saho_no` = '', `saho_reg_date` = '0000-00-00' WHERE `mid` = '255399'"
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
