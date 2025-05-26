require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jobsRouter = require('./routes/jobs');
const emailAuthRouter = require('./routes/emailAuth');
const authRouter = require('./routes/auth');
const gptRouter = require('./routes/gpt');
const { startTokenCleanupScheduler } = require('./Utils/tokenCleaner'); // 경로에 맞게 수정

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobsRouter);
// 이메일 인증 라우터
app.use('/api/emailAuth', emailAuthRouter);
// 로그인 등 유효성 검사
app.use('/api/auth', authRouter);
// gpt 결과 라우터
app.use('/api/gpt', gptRouter);

startTokenCleanupScheduler();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
