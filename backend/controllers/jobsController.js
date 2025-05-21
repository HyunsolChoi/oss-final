const { executeQuery } = require('../Utils/executeDB');

/**
 * 최신 8개 공고
 */
exports.getLatestJobs = async (req, res) => {
    const query = `
    SELECT
      j.job_posting_id AS id,
      c.company_name AS company,
      j.title,
      j.link,
      GROUP_CONCAT(DISTINCT l.location_name) AS location,
      GROUP_CONCAT(DISTINCT e.experience_level) AS experience,
      ed.education_level       AS education,
      et.employment_type_name  AS employmentType,
      j.salary,
      j.deadline,
      GROUP_CONCAT(DISTINCT s.sector_name) AS sector
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
    LEFT JOIN locations l      ON jpl.location_id = l.location_id
    LEFT JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
    LEFT JOIN experiences e    ON jpe.experience_id = e.experience_id
    LEFT JOIN educations ed    ON j.education_id = ed.education_id
    LEFT JOIN job_posting_employment_types jpet ON j.job_posting_id = jpet.job_posting_id
    LEFT JOIN employment_types et ON jpet.employment_type_id = et.employment_type_id
    LEFT JOIN job_posting_sectors jps ON j.job_posting_id = jps.job_posting_id
    LEFT JOIN sectors s        ON jps.sector_id = s.sector_id
    GROUP BY j.job_posting_id
    ORDER BY j.created_at DESC
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
      DISTINCT j.job_posting_id AS id,
      c.company_name AS company,
      j.title,
      j.link,
      e.experience_level AS experience,
      j.salary,
      j.deadline
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
    JOIN experiences e ON jpe.experience_id = e.experience_id
    WHERE e.experience_level IN ('신입')
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
