const { executeQuery } = require('../Utils/executeDB');

// 즐겨찾기 여부 조회
exports.checkBookmark = async (req, res) => {
    const { userId, jobId } = req.query;

    if (!userId || !jobId) {
        return res.status(400).json({ success: false, message: 'userId와 jobId가 필요합니다.' });
    }

    try {
        const [rows] = await executeQuery(
            `SELECT 1 FROM bookmarks WHERE user_id = ? AND job_posting_id = ? LIMIT 1`,
            [userId, jobId]
        );

        const isBookmarked = rows.length > 0;
        return res.json({ success: true, bookmarked: isBookmarked });
    } catch (e) {
        console.error('checkBookmark 오류:', e.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};


// 즐겨찾기 토글
exports.toggleBookmark = async (req, res) => {
    const { userId, jobId } = req.body;

    if (!userId || !jobId) {
        return res.status(400).json({ success: false, message: 'userId와 jobId가 필요합니다.' });
    }

    try {
        // 현재 즐겨찾기 여부 확인
        const [rows] = await executeQuery(
            `SELECT 1 FROM bookmarks WHERE user_id = ? AND job_posting_id = ? LIMIT 1`,
            [userId, jobId]
        );

        if (rows.length > 0) {
            // 이미 즐겨찾기 된 경우 → 삭제
            await executeQuery(
                `DELETE FROM bookmarks WHERE user_id = ? AND job_posting_id = ?`,
                [userId, jobId]
            );
            return res.json({ success: true, bookmarked: false });
        } else {
            // 즐겨찾기 추가
            await executeQuery(
                `INSERT INTO bookmarks (user_id, job_posting_id) VALUES (?, ?)`,
                [userId, jobId]
            );
            return res.json({ success: true, bookmarked: true });
        }
    } catch (e) {
        console.error('toggleBookmark 오류:', e.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

// 즐겨찾기 공고 조회
exports.getBookmarkedJobs = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId는 필수입니다.' });
    }

    try {
        const [rows] = await executeQuery(
            `
            SELECT 
                j.job_posting_id AS id,
                j.title,
                j.deadline,
                j.link,
                c.company_name AS company,
                GROUP_CONCAT(DISTINCT e.experience_level SEPARATOR '/ ') AS experience,
                GROUP_CONCAT(DISTINCT l.location_name SEPARATOR '/ ') AS location,
                GROUP_CONCAT(DISTINCT et.employment_type_name SEPARATOR '/ ') AS employmentType
            FROM bookmarks b
            JOIN job_postings j ON b.job_posting_id = j.job_posting_id
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_posting_experiences jpe ON j.job_posting_id = jpe.job_posting_id
            LEFT JOIN experiences e ON jpe.experience_id = e.experience_id
            LEFT JOIN job_posting_locations jpl ON j.job_posting_id = jpl.job_posting_id
            LEFT JOIN locations l ON jpl.location_id = l.location_id
            LEFT JOIN job_posting_employment_types jpet ON j.job_posting_id = jpet.job_posting_id
            LEFT JOIN employment_types et ON jpet.employment_type_id = et.employment_type_id
            WHERE b.user_id = ?
            GROUP BY j.job_posting_id
            ORDER BY b.created_at DESC
            `,
            [userId]
        );

        return res.json({ success: true, jobs: rows });
    } catch (e) {
        console.error('getBookmarkedJobs 오류:', e.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

// 즐겨찾기 다중 삭제
exports.deleteBookmarks = async (req, res) => {
    const { userId, jobIds } = req.body;

    if (!userId || !Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ success: false, message: 'userId와 jobIds 배열이 필요합니다.' });
    }

    try {
        const placeholders = jobIds.map(() => '?').join(', ');
        const params = [userId, ...jobIds];

        await executeQuery(
            `DELETE FROM bookmarks WHERE user_id = ? AND job_posting_id IN (${placeholders})`,
            params
        );

        return res.json({ success: true, deleted: jobIds.length });
    } catch (e) {
        console.error('deleteBookmarks 오류:', e.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};
