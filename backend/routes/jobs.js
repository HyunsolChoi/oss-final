const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/jobsController');

router.get('/latest',  ctrl.getLatestJobs);
router.get('/top100',  ctrl.getTop100Jobs);
router.get('/entry',   ctrl.getEntryLevelJobs);
router.post('/myjobs',   ctrl.getMyJobs);
router.post('/search', ctrl.searchJobs);

module.exports = router;
