// routes/emailAuth.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// 간단한 메모리 저장소 (운영 시에는 Redis 등 사용 권장)
const codes = {};

// SMTP transporter 설정
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

// 1) 인증 코드 요청
router.post('/', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일이 필요합니다.' });

    // 6자리 난수 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 2분 뒤 만료
    codes[email] = { code, expires: Date.now() + 2 * 60 * 1000 };

    try {
            await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'CareerFit 이메일 인증 코드',
            text: `인증 코드: ${code}\n`,
        });
        return res.json({ success: true });
    } catch (err) {
        console.error('메일 전송 오류', err);
        return res.status(500).json({ message: '메일 전송 실패' });
    }
});

// 2) 인증 코드 검증
router.post('/verify', (req, res) => {
    const { email, code } = req.body;
    const record = codes[email];
    if (
        !record ||
        record.code !== code ||
        record.expires < Date.now()
    ) {
        return res.status(400).json({ success: false, message: '인증 실패' });
    }
    // 검증 완료 후 코드 삭제
    delete codes[email];
    res.json({ success: true });
});

module.exports = router;
