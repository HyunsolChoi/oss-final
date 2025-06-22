require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jobsRouter = require('./routes/jobs');
const emailAuthRouter = require('./routes/emailAuth');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const gptRouter = require('./routes/gpt');
const bookmarkRouter = require('./routes/bookmark');
const { startScheduler } = require('./Utils/scheduler');

const app = express();
app.use(cors());
app.use(express.json());

// 채용 공고 조회 등
app.use('/api/jobs', jobsRouter);
// 이메일 인증 라우터
app.use('/api/emailAuth', emailAuthRouter);
// 로그인 등 유효성 검사
app.use('/api/auth', authRouter);
// 사용자 정보 관리
app.use('/api/user', userRouter);
// gpt 결과 라우터
app.use('/api/gpt', gptRouter);
// 즐겨찾기 라우터
app.use('/api/bookmark', bookmarkRouter);

startScheduler();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
