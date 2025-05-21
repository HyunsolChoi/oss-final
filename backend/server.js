require('dotenv').config();
const express= require('express');
const jobsRouter= require('./routes/jobs');

const app = express();
app.use(express.json());
app.use('/api/jobs', jobsRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
