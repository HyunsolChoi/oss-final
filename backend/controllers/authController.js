const { executeQuery } = require('../Utils/executeDB');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports.authSignin = async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ success: false, message: 'userId와 password는 필수입니다.' });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    console.log(hash);

    const query = `
      SELECT user_id FROM users
      WHERE user_id = ? AND password = ?
      LIMIT 1
    `;

    try {
        const [rows] = await executeQuery(query, [userId, hash]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: '로그인 실패' });
        }

        const tokenPayload = { userId };
        const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '2h' });

        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2시간 후

        await executeQuery(
            `INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE refresh_token = ?, expires_at = ?`,
            [userId, accessToken, expiresAt, accessToken, expiresAt]
        );

        res.json({ success: true, token: accessToken });

    } catch (e) {
        console.error('authSignin 오류:', e.message);
        return res.status(500).json({ error: e.message });
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
