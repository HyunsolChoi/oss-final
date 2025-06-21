const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/bookmarkController');


router.get('/check', ctrl.checkBookmark);
router.get('/get', ctrl.getBookmarkedJobs);

router.post('/toggle', ctrl.toggleBookmark);
router.post('/delete', ctrl.deleteBookmarks)

module.exports = router;