const { executeQuery, executeTransaction } = require('../Utils/executeDB');

// 프로필 정보 수정
exports.updateProfile = async (req, res) => {
    const { userId, sector, education, region, skills } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId는 필수입니다.' });
    }

    const queries = [];

    try {
        // 직무(직군) 변경
        if (sector && sector.trim() !== "") {
            queries.push({
                query: `UPDATE users SET sector = ? WHERE user_id = ?`,
                params: [sector, userId],
            });
        }

        // 학력 변경
        if (education && education.trim() !== "") {
            const [[eduRow]] = await executeQuery(
                `SELECT user_education_id FROM user_educations WHERE education_name = ? LIMIT 1`,
                [education]
            );
            let eduId = eduRow?.user_education_id;

            if (!eduId) {
                const [{ insertId }] = await executeQuery(
                    `INSERT INTO user_educations (education_name) VALUES (?)`,
                    [education]
                );
                eduId = insertId;
            }

            // 기존 매핑 삭제 후 재삽입
            queries.push({
                query: `DELETE FROM user_educations_mapping WHERE user_id = ?`,
                params: [userId],
            });
            queries.push({
                query: `INSERT INTO user_educations_mapping (user_id, user_education_id) VALUES (?, ?)`,
                params: [userId, eduId],
            });
        }

        // 지역 변경
        if (region && region.trim() !== "") {
            const [[locRow]] = await executeQuery(
                `SELECT location_id FROM user_locations WHERE location_name = ? LIMIT 1`,
                [region]
            );
            let locId = locRow?.location_id;

            if (!locId) {
                const [{ insertId }] = await executeQuery(
                    `INSERT INTO user_locations (location_name) VALUES (?)`,
                    [region]
                );
                locId = insertId;
            }

            // 기존 매핑 삭제 후 재삽입
            queries.push({
                query: `DELETE FROM user_location_mapping WHERE user_id = ?`,
                params: [userId],
            });
            queries.push({
                query: `INSERT INTO user_location_mapping (user_id, location_id) VALUES (?, ?)`,
                params: [userId, locId],
            });
        }

        // 기술 변경
        if (skills && Array.isArray(skills) && skills.length > 0) {
            queries.push({
                query: `DELETE FROM user_skills WHERE user_id = ?`,
                params: [userId],
            });

            for (const name of skills) {
                if (!name || typeof name !== "string") continue;

                // INSERT OR IGNORE + SELECT를 트랜잭션 쿼리 배열에 포함
                queries.push({
                    query: `INSERT INTO skills (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name`,
                    params: [name],
                });

                queries.push({
                    query: `
                        INSERT INTO user_skills (user_id, skill_id)
                        SELECT ?, skill_id FROM skills WHERE name = ? LIMIT 1
                    `,
                    params: [userId, name],
                });
            }

        }

        if (queries.length === 0) {
            return res.status(200).json({ success: true, message: '변경된 정보가 없습니다.' });
        }

        await executeTransaction(queries);
        return res.status(200).json({ success: true, message: '정보가 수정되었습니다.' });

    } catch (e) {
        console.error('authUpdateProfile 오류:', e.message);
        return res.status(500).json({ success: false, message: '정보 수정 중 오류 발생' });
    }
};

// 프로필 정보 조회
exports.getUserProfile = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId는 필수입니다' });
    }

    try {
        const [rows] = await executeQuery(`
            SELECT 
                u.sector,
                ue.education_name AS education,
                ul.location_name AS region,
                GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ',') AS skills
            FROM users u
            LEFT JOIN user_educations_mapping uem ON u.user_id = uem.user_id
            LEFT JOIN user_educations ue ON uem.user_education_id = ue.user_education_id
            LEFT JOIN user_location_mapping ulm ON u.user_id = ulm.user_id
            LEFT JOIN user_locations ul ON ulm.location_id = ul.location_id
            LEFT JOIN user_skills us ON u.user_id = us.user_id
            LEFT JOIN skills s ON us.skill_id = s.skill_id
            WHERE u.user_id = ?
            GROUP BY u.user_id, ue.education_name, ul.location_name;
        `, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다' });
        }

        const result = rows[0];
        return res.json({
            success: true,
            sector: result.sector || '',
            education: result.education || '',
            region: result.region || '',
            skills: result.skills ? result.skills.split(',') : [],
        });

    } catch (e) {
        console.error('getUserProfile 오류:', e.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};