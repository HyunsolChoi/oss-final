const { executeQuery, executeTransaction } = require('../Utils/executeDB');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports.authSignin = async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ success: false, message: 'userId와 password는 필수입니다' });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    try {
        // ID 존재 여부 확인
        const idCheckQuery = `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`;
        const [idRows] = await executeQuery(idCheckQuery, [userId]);

        if (idRows.length === 0) {
            return res.status(401).json({ success: false, message: '존재하지 않는 아이디입니다' });
        }

        // 비밀번호 확인
        const pwdCheckQuery = `
            SELECT user_id FROM users
            WHERE user_id = ? AND password = ?
            LIMIT 1
        `;
        const [rows] = await executeQuery(pwdCheckQuery, [userId, hash]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: '비밀번호가 틀렸습니다' });
        }

        // 로그인 성공 처리
        const tokenPayload = { userId };
        const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '2h' });

        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

        await executeQuery(
            `INSERT INTO user_tokens (user_id, refresh_token, expires_at)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE refresh_token = ?, expires_at = ?`,
            [userId, accessToken, expiresAt, accessToken, expiresAt]
        );

        res.json({ success: true, token: accessToken });

    } catch (e) {
        console.error('authSignin 오류:', e.message);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

exports.authSignout = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId는 필수입니다.' });
    }

    const query = `DELETE FROM user_tokens WHERE user_id = ?`;

    try {
        // const result =
        await executeQuery(query, [userId]);

        // DELETE 쿼리는 영향을 받은 행 수만 리턴, 하지만 서버의 주기적인 토큰 테이블 관리로 이미 없을 수도 있음, 그러므로 없다해도 문제없음
        // if (result.affectedRows === 0) {
        //     return res.status(404).json({ success: false, message: '이미 로그아웃되었거나 존재하지 않는 사용자입니다.' });
        // }

        return res.json({ success: true, message: '로그아웃 완료' });

    } catch (e) {
        console.error('authSignout 오류:', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};

// 이메일 중복 검사
exports.checkDuplicateEmail = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: '이메일은 필수입니다.' });
    }

    try {
        const query = `SELECT email FROM users WHERE email = ? LIMIT 1`;
        const [rows] = await executeQuery(query, [email]);

        if (rows.length > 0) {
            // 이메일 중복됨
            return res.json({ success: true, duplicate: true });
        } else {
            // 이메일 사용 가능
            return res.json({ success: true, duplicate: false });
        }

    } catch (e) {
        console.error('authCheckEmail 오류:', e.message);
        return res.status(500).json({ success: false, message: '이메일 중복 검사 중 오류 발생' });
    }
};

// 아이디 중복 검사
exports.checkDuplicateId = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId는 필수입니다.' });
    }

    try {
        const query = `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`;
        const [rows] = await executeQuery(query, [userId]);

        if (rows.length > 0) {
            // 아이디 중복됨
            return res.json({ success: true, duplicate: true });
        } else {
            // 사용 가능한 아이디
            return res.json({ success: true, duplicate: false });
        }

    } catch (e) {
        console.error('checkDuplicateId 오류:', e.message);
        return res.status(500).json({ success: false, message: '아이디 중복 검사 중 오류 발생' });
    }
};


// 비밀번호 변경
exports.authChangePassword = async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: '모든 항목이 필요합니다' });
    }

    try {
        // 현재 비밀번호 확인
        const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
        const checkQuery = `SELECT user_id FROM users WHERE user_id = ? AND password = ? LIMIT 1`;
        const [rows] = await executeQuery(checkQuery, [userId, currentHash]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: '현재 비밀번호가 올바르지 않습니다' });
        }

        // 새 비밀번호 해시 후 업데이트
        const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
        const updateQuery = `UPDATE users SET password = ? WHERE user_id = ?`;
        await executeQuery(updateQuery, [newHash, userId]);

        return res.json({ success: true, message: '비밀번호가 변경되었습니다' });
    } catch (e) {
        console.error('authChangePassword 오류:', e.message);
        return res.status(500).json({ success: false, message: '비밀번호 변경 중 오류 발생' });
    }
};

// 회원가입
exports.authSignup = async (req, res) => {
    const { userId, email, password, sector, education, region, skills } = req.body;

    if (!userId || !email || !password || !sector || !education || !region || !skills || !Array.isArray(skills)) {
        return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    const hashedPwd = crypto.createHash('sha256').update(password).digest('hex');
    const queries = [];

    try {
        // 1. users 테이블에 사용자 정보 삽입
        queries.push({
            query: `INSERT INTO users (user_id, email, password, sector) VALUES (?, ?, ?, ?)`,
            params: [userId, email, hashedPwd, sector]
        });

        // 2. 학력 ID 확인 또는 삽입
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

        queries.push({
            query: `INSERT INTO user_educations_mapping (user_id, user_education_id) VALUES (?, ?)`,
            params: [userId, eduId]
        });

        // 3. 지역 ID 확인 또는 삽입
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

        queries.push({
            query: `INSERT INTO user_location_mapping (user_id, location_id) VALUES (?, ?)`,
            params: [userId, locId]
        });

        // 4. 기술 처리
        for (const name of skills) {
            if (!name || typeof name !== 'string') continue;

            const [[skillRow]] = await executeQuery(
                `SELECT skill_id FROM skills WHERE name = ? LIMIT 1`,
                [name]
            );

            let skillId = skillRow?.skill_id;
            if (!skillId) {
                const [{ insertId }] = await executeQuery(
                    `INSERT INTO skills (name) VALUES (?)`,
                    [name]
                );
                skillId = insertId;
            }

            queries.push({
                query: `INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)`,
                params: [userId, skillId]
            });
        }

        // 트랜잭션 실행
        await executeTransaction(queries);
        return res.status(201).json({ success: true, message: '회원가입 완료' });

    } catch (e) {
        console.error('authSignup 오류:', e.message);
        return res.status(500).json({ success: false, message: '회원가입 중 오류 발생' });
    }
};
