const { executeQuery } = require('../Utils/executeDB');
const nodemailer = require('nodemailer');
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls:{
        rejectUnauthorized: false // 개발/테스트용으로만, 프로덕션에서는 CA 인증서 추가 방식 권장
    }
});

// 이메일 인증 코드 검증
async function validateEmailCode(email, code) {
    const query = `
        SELECT code, created_at
        FROM email_verification
        WHERE email = ?
    `;
    const [rows] = await executeQuery(query, [email]);

    if (!rows || rows.length === 0) {
        return { success: false, reason: '인증 정보 없음' };
    }

    const record = rows[0];

    const isExpired = new Date(record.created_at).getTime() < Date.now() - 3 * 60 * 1000;

    if (record.code !== code) {
        return { success: false, reason: '코드 불일치' };
    }

    await executeQuery(`DELETE FROM email_verification WHERE email = ?`, [email]);

    if (isExpired) {
        return { success: false, reason: '인증 만료' };
    }

    return { success: true };
}

// 인증 코드 요청
exports.requestVerificationCode = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일이 필요합니다' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'CareerFit 이메일 인증 코드',
            text: `인증 코드: ${code}\n`,
        });

        const deleteQuery = `DELETE FROM email_verification WHERE email = ?`;
        await executeQuery(deleteQuery, [email]);

        const insertQuery = `
            INSERT INTO email_verification (email, code)
            VALUES (?, ?)
        `;
        await executeQuery(insertQuery, [email, code]);

        return res.json({ success: true });
    } catch (err) {
        console.error('메일 전송 오류', err);
        return res.status(500).json({ message: '메일 전송 실패' });
    }
};

// 코드 검증
exports.verifyCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ success: false, message: '요청이 유효하지 않습니다' });
    }

    try {
        const result = await validateEmailCode(email, code);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.reason });
        }

        res.cookie('careerfit_emailVerified', 'true', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 10 * 60 * 1000,
            sameSite: 'lax',
        });

        return res.json({ success: true });
    } catch (err) {
        console.error('인증 검증 오류:', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

// 코드 인증 및 아이디 찾기
exports.findIdVerifyCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ success: false, message: '이메일과 코드가 필요합니다' });
    }

    try {
        const result = await validateEmailCode(email, code);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.reason });
        }

        const idCheckQuery = `SELECT user_id FROM users WHERE email = ? LIMIT 1`;
        const [idRows] = await executeQuery(idCheckQuery, [email]);

        if (!idRows || idRows.length === 0) {
            return res.status(401).json({ success: false, message: '사용자 정보가 없습니다' });
        }

        const userId = idRows[0].user_id;
        return res.json({ success: true, message: userId });
    } catch (err) {
        console.error('아이디 찾기 인증 오류:', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
    const { userId, email } = req.body;

    if (!email || !userId) return res.status(400).json({ success: false, message: '이메일과 아이디가 필요합니다' });

    const pwQuery = `SELECT password FROM users WHERE user_id = ? AND email = ? LIMIT 1`;

    const rows = await executeQuery(pwQuery, [userId, email]);

    if (!rows || rows.length === 0) {
        return res.status(400).json({ message: '회원정보 없음' });
    }

    // 길이 13의 임의 비밀번호 생성
    const generateValidPassword = () => {
        const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const specials = '!@';
        const all = letters + numbers + specials;
        const getRand = (str) => str[Math.floor(Math.random() * str.length)];
        const required = [getRand(letters), getRand(numbers), getRand(specials)];
        const rest = Array.from({ length: 10 }, () => getRand(all));
        return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
    };

    const newPassword = generateValidPassword();

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    const updateQuery = `UPDATE users SET password = ? WHERE user_id = ?`;
    const reset = await executeQuery(updateQuery, [newHash, userId]);

    if(!reset) res.status(500).json({ success: false, message: '비밀번호 변경 실패' });

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'CareerFit 비밀번호 재설정',
            text: `임시 비밀번호: ${newPassword}\n`,
        });
        return res.json({ success: true });
    } catch (err) {
        console.error('메일 전송 오류', err);
        return res.status(500).json({ success: false, message: '메일 전송 실패' });
    }
}