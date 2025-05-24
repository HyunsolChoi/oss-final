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
      j.deadline
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
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
 * 신입/인턴 필터
 */
exports.getEntryLevelJobs = async (req, res) => {
    const query = `
      SELECT
        j.job_posting_id AS id,
        c.company_name      AS company,
        j.title,
        j.link,
        j.views,
        e.experience_level  AS experience,
        j.deadline
      FROM job_postings j
      JOIN companies c ON j.company_id = c.company_id
      JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
      JOIN experiences e    ON jpe.experience_id = e.experience_id
      WHERE e.experience_id = 1
      ORDER BY j.created_at DESC
      LIMIT 100
    `;

    try {
        const [rows] = await executeQuery(query, []);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMyJobs = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    try {
        // 1. 사용자 역할(role) 조회
        const [[user]] = await executeQuery(
            `SELECT role FROM users WHERE user_id = ?`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const roleKeywords = user.role.split(' ').map(k => k.trim()).filter(k => k);
        if (roleKeywords.length === 0) {
            return res.status(200).json([]); // 역할이 없으면 공고도 없음
        }

        // 2. 역할 키워드 기반으로 공고 검색
        const conditions = roleKeywords.map(() => `j.title LIKE ?`).join(' OR ');
        const values = roleKeywords.map(k => `%${k}%`);

        const query = `
            SELECT
                j.job_posting_id AS id,
                c.company_name AS company,
                j.title,
                j.link,
                e.experience_level AS experience,
                j.salary,
                j.deadline
            FROM job_postings j
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN experiences e ON j.experience_id = e.experience_id
            WHERE ${conditions};
        `;

        const [rows] = await executeQuery(query, values);
        res.json(rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};
