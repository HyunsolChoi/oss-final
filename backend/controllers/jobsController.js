const { executeQuery } = require('../Utils/executeDB');

/**
 * 최신 8개 공고
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
      LIMIT 8
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
        e.experience_level  AS experience,
        j.salary,
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
