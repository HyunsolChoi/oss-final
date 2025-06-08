const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/jobsController');

router.get('/latest',  ctrl.getLatestJobs);
router.get('/top100',  ctrl.getTop100Jobs);
router.get('/entry',   ctrl.getEntryLevelJobs);
router.get('/check-bookmark', ctrl.checkBookmark);
router.post('/myjobs',   ctrl.getMyJobs);
router.post('/search', ctrl.searchJobs);
router.post('/jobinfo', ctrl.getJobInfo);
router.post('/region', ctrl.getJobsByRegion);
router.post('/increase-view', ctrl.increaseView);
router.post('/toggle-bookmark', ctrl.toggleBookmark);

module.exports = router;