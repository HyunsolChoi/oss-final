require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jobsRouter = require('./routes/jobs');
const emailAuthRouter = require('./routes/emailAuth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobsRouter);
// 이메일 인증 라우터
app.use('/api/emailAuth', emailAuthRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
