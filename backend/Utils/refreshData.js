const crawlSaramin = require('../DB_setup/crawlData');
const insertData = require('../DB_setup/insertData');
const { getConnection } = require('./connectDB');
const crypto = require('crypto');
const axios = require('axios');

async function refreshData() {
    const connection = await getConnection();

    const [openEndedRows] = await connection.execute(`
        SELECT job_posting_id, link FROM job_postings
        WHERE deadline IN ('채용시', '상시채용')
    `);

    // 1. 기한 지난 공고 삭제
    await connection.execute(`
        DELETE FROM job_postings
        WHERE deadline REGEXP '^[0-9]{2}/[0-9]{2}'
            AND STR_TO_DATE(
                CONCAT(YEAR(CURDATE()), '-', SUBSTRING_INDEX(deadline, '(', 1)),
                '%Y-%m/%d'
                ) < CURDATE();
    `);

    // 채용시, 상시채용 공고는 링크의 유효성 검사 후 삭제
    for (const row of openEndedRows) {
        try {
            const response = await axios.get(row.link, {
                timeout: 3000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                },
                validateStatus: () => true  // 모든 응답 허용, 직접 검사
            });

            if (response.status >= 400) {
                await connection.execute('DELETE FROM job_postings WHERE job_posting_id = ?', [row.job_posting_id]);
                console.log(`[삭제됨] 비정상 응답 (${response.status}): ${row.link}`);
            } else {
                console.log(`[유지됨] ${row.link}`);
            }

        } catch (error) {
            console.error(`[요청 실패] ${row.link} → ${error.code || error.message}`);
            await connection.execute('DELETE FROM job_postings WHERE job_posting_id = ?', [row.job_posting_id]);
        }
    }

    // 2. 기존 해시값 조회
    const [rows] = await connection.execute(`SELECT link_hash FROM job_postings`);
    const existingHashes = new Set(rows.map(r => r.link_hash));

    // 3. 새 데이터 크롤링
    const crawledData = await crawlSaramin(200); // 최대 250

    // 4. 중복 제거
    const filteredData = crawledData.filter(job => {
        const hash = crypto.createHash('sha256').update(job['링크']).digest('hex');
        return !existingHashes.has(hash);
    });

    console.log(`신규 공고 ${filteredData.length}건 삽입 예정`);

    // 5. 삽입
    await insertData(filteredData);

    await connection.end();
}

module.exports = { refreshData };