const { executeQuery } = require('../Utils/executeDB');
const { buildRegionLikePatterns } = require('../Utils/regionFilter');

/**
 * 랜덤 10개 공고, 임의
 */
exports.getLatestJobs = async (req, res) => {
    const query = `
      SELECT
        j.job_posting_id AS id,
        j.title,
        j.deadline,
        c.company_name AS company
      FROM job_postings j
      JOIN companies c ON j.company_id = c.company_id
      ORDER BY RAND()
      LIMIT 10
    `;

    try {
        const [rows] = await executeQuery(query, []);
        res.json(rows);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: e.message });
    }
};

/**
 * 조회수 기준 Top100
 */
exports.getTop100Jobs = async (req, res) => {
    const query = `
        SELECT
      j.job_posting_id AS id,
      c.company_name AS company,
      j.title,
      j.link,
      j.views,
      GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
      GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location,
      j.deadline
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
    LEFT JOIN sectors s ON jps.sector_id = s.sector_id
    LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
    LEFT JOIN locations l ON jpl.location_id = l.location_id
    GROUP BY j.job_posting_id
    ORDER BY j.views DESC
    LIMIT 100
  `;
    try {
        const [rows] = await executeQuery(query, []);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 신입 필터
 */
exports.getEntryLevelJobs = async (req, res) => {
    const query = `
          SELECT
      j.job_posting_id AS id,
      c.company_name AS company,
      j.title,
      j.link,
      e.experience_level AS experience,
      GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
      GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location,
      j.deadline
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
    JOIN experiences e ON jpe.experience_id = e.experience_id
    LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
    LEFT JOIN sectors s ON jps.sector_id = s.sector_id
    LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
    LEFT JOIN locations l ON jpl.location_id = l.location_id
    WHERE e.experience_id = 1
    GROUP BY j.job_posting_id
    ORDER BY j.created_at DESC
    `;

    try {
        const [rows] = await executeQuery(query, []);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
/**
 * 사용자 직무 관련 공고
 */
exports.getMyJobs = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    try {
        const [[user]] = await executeQuery(
            `SELECT sector FROM users WHERE user_id = ?`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const keyword = `%${user.sector}%`;

        const [sectorRows] = await executeQuery(
            `SELECT sector_id FROM sectors WHERE sector_name LIKE ?`,
            [keyword]
        );

        // 매칭된 분야 없음
        if (sectorRows.length === 0) {
            return res.status(200).json([]);
        }

        const sectorIds = sectorRows.map(row => row.sector_id);

        // 공고 조회
        const query = `
            SELECT
                j.job_posting_id AS id,
                ANY_VALUE(c.company_name) AS company,
                ANY_VALUE(j.title) AS title,
                ANY_VALUE(j.link) AS link,
                ANY_VALUE(e.experience_level) AS experience,
                ANY_VALUE(ed.education_level) AS education,
                GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location,
                GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
                ANY_VALUE(j.deadline) AS deadline
            FROM job_postings j
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
            LEFT JOIN experiences e ON jpe.experience_id = e.experience_id
            LEFT JOIN educations ed ON j.education_id = ed.education_id
            JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
            JOIN sectors s ON jps.sector_id = s.sector_id
            LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
            LEFT JOIN locations l ON jpl.location_id = l.location_id
            WHERE jps.sector_id IN (${sectorIds.map(() => '?').join(', ')})
            GROUP BY j.job_posting_id
            ORDER BY j.created_at DESC
        `;


        const [rows] = await executeQuery(query, sectorIds);
        res.json(rows);
    } catch (err) {
        console.error('getMyJobs 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 *
 * 키워드 검색
 */
exports.searchJobs = async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: '검색어가 필요합니다' });
    }

    const raw = query.trim();
    // 공백으로 분리한 뒤, 모두 2글자 이상인지 확인
    const parts = raw.split(/\s+/);
    const keywords = parts.every(p => p.length >= 2) ? parts : [raw];
    const likeParams = keywords.map(k => `%${k}%`);

    try {
        // 제목 기반 검색
        const [titleMatches] = await executeQuery(`
        SELECT DISTINCT
            j.job_posting_id AS id,
            j.title, j.deadline, j.link, j.views,
            c.company_name AS company,
            GROUP_CONCAT(DISTINCT s.sector_name) AS sectors,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location
        FROM job_postings j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
        LEFT JOIN sectors s ON jps.sector_id = s.sector_id
        LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
        LEFT JOIN locations l ON jpl.location_id = l.location_id
        WHERE ${keywords.map(() => 'j.title LIKE ?').join(' OR ')}
        GROUP BY j.job_posting_id
    `, likeParams);

        // 직무 기반 검색
        const [sectorMatches] = await executeQuery(`
        SELECT DISTINCT
            j.job_posting_id AS id,
            j.title, j.deadline, j.link, j.views,
            c.company_name AS company,
            GROUP_CONCAT(DISTINCT s.sector_name) AS sectors,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location
        FROM job_postings j
        JOIN companies c ON j.company_id = c.company_id
        JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
        JOIN sectors s ON jps.sector_id = s.sector_id
        LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
        LEFT JOIN locations l ON jpl.location_id = l.location_id
        WHERE ${keywords.map(() => 's.sector_name LIKE ?').join(' OR ')}
        GROUP BY j.job_posting_id
    `, likeParams);

        // 회사명 기반 검색
        const [companyMatches] = await executeQuery(`
        SELECT DISTINCT
            j.job_posting_id AS id,
            j.title, j.deadline, j.link, j.views,
            c.company_name AS company,
            GROUP_CONCAT(DISTINCT s.sector_name) AS sectors,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location
        FROM job_postings j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
        LEFT JOIN sectors s ON jps.sector_id = s.sector_id
        LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
        LEFT JOIN locations l ON jpl.location_id = l.location_id
        WHERE ${keywords.map(() => 'c.company_name LIKE ?').join(' OR ')}
        GROUP BY j.job_posting_id
    `, likeParams);

        // 병합 + 중복 제거
        const seen = new Set();
        const merged = [];
        for (const list of [titleMatches, sectorMatches, companyMatches]) {
            for (const job of list) {
                if (!seen.has(job.id)) {
                    seen.add(job.id);
                    merged.push(job);
                }
            }
        }


        return res.json(merged);
    } catch (err) {
        console.error('검색 오류:', err.message);
        return res.status(500).json({ error: '검색 중 오류 발생' });
    }
};

/**
 * jobID로 공고 정보 조회 (consulting 페이지)
 *
 */
exports.getJobInfo = async (req, res) => {
    const { jobId } = req.body;

    if (!jobId) {
        return res.status(400).json({ success: false, message: 'jobId가 필요합니다' });
    }

    try {
        const [[job]] = await executeQuery(`
      SELECT
          j.job_posting_id AS id,
          c.company_name AS company,
          j.title,
          j.link,
          GROUP_CONCAT(DISTINCT l.location_name SEPARATOR '/ ') AS location,
          GROUP_CONCAT(DISTINCT e.experience_level SEPARATOR '/ ') AS experience,
          ed.education_level AS education,
          GROUP_CONCAT(DISTINCT et.employment_type_name SEPARATOR '/ ') AS employmentType,
          j.salary,
          j.views,
          GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR '/ ') AS sectors,
          j.deadline
        FROM job_postings j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
        LEFT JOIN locations l ON jpl.location_id = l.location_id
        LEFT JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
        LEFT JOIN experiences e ON jpe.experience_id = e.experience_id
        LEFT JOIN educations ed ON j.education_id = ed.education_id
        LEFT JOIN job_posting_employment_types jpet ON j.job_posting_id = jpet.job_posting_id
        LEFT JOIN employment_types et ON jpet.employment_type_id = et.employment_type_id
        LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
        LEFT JOIN sectors s ON jps.sector_id = s.sector_id
        WHERE j.job_posting_id = ?
        GROUP BY j.job_posting_id;
    `, [jobId]);

        if (!job) {
            return res.status(404).json({ success: false, message: '공고 정보를 찾을 수 없습니다.' });
        }

        return res.json({
            success: true,
            job,
        });

    } catch (err) {
        console.error('[getJobInfo] 오류:', err.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};


/**
 * 지역별 채용공고 조회
 */
exports.getJobsByRegion = async (req, res) => {
    const { region } = req.body;

    if (!region) {
        return res.status(400).json({ error: '지역 정보가 필요합니다' });
    }

    try {

        const likePatterns = buildRegionLikePatterns(region);       // ex) ["%경기%","%인천%"]

        const likePlaceholders =
            likePatterns.map(() => 'l.location_name LIKE ?').join(' OR ') + ' OR l.location_name = ?';

        const query = `
          SELECT DISTINCT
            j.job_posting_id AS id,
            c.company_name   AS company,
            j.title,
            j.link,
            j.views,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS location,
            GROUP_CONCAT(DISTINCT s.sector_name   SEPARATOR ', ') AS sectors,
            j.deadline
          FROM job_postings j
          JOIN companies            c   ON j.company_id       = c.company_id
          JOIN job_posting_locations jpl ON j.job_posting_id   = jpl.job_posting_id
          JOIN locations             l   ON jpl.location_id    = l.location_id
          LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
          LEFT JOIN sectors            s   ON jps.sector_id     = s.sector_id
          WHERE (${likePlaceholders})
          GROUP BY j.job_posting_id
          ORDER BY j.views DESC
        `;

        const params = [...likePatterns, '전국'];   // ex) ["%경기%","%인천%","전국"]

        const [rows] = await executeQuery(query, params);
        res.json(rows);
    } catch (err) {
        console.error('getJobsByRegion 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 조회수 증가 - 3분 내에 중복 조회 시 증가 하지않도록 함
exports.increaseView = async (req, res) => {
    const { jobId, userId } = req.body;

    if (!jobId || !userId) {
        return res.status(400).json({ success: false, message: 'jobId와 userId는 필수입니다.' });
    }

    try {
        // 1. 기존 기록 확인
        const [[existing]] = await executeQuery(
            `SELECT viewed_at FROM manage_view WHERE user_id = ? AND job_posting_id = ?`,
            [userId, jobId]
        );

        if (existing) {
            const lastViewed = new Date(existing.viewed_at);
            const now = new Date();
            const diffMs = now.getTime() - lastViewed.getTime();
            const diffMinutes = diffMs / (1000 * 60);

            // 마지막 조회 3분 미만이면 조회수 증가 안함
            if (diffMinutes < 3) {
                return res.json({ success: true, message: '3분 이내 재조회 - 조회수 증가 생략' });
            }
        }

        // 2. 조회 기록 갱신 (없으면 insert, 있으면 update)
        await executeQuery(
            `INSERT INTO manage_view (user_id, job_posting_id, viewed_at)
             VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE
             viewed_at = VALUES(viewed_at)`,
            [userId, jobId]
        );

        // 3. 조회수 증가
        await executeQuery(
            `UPDATE job_postings SET views = views + 1 WHERE job_posting_id = ?`,
            [jobId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('[increaseView] 오류:', err.message);
        res.status(500).json({ success: false, message: '조회수 증가 중 오류 발생' });
    }
};
