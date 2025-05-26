const { executeQuery } = require('../Utils/executeDB');

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
