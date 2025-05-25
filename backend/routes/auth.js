const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/authController');

router.post('/signin', ctrl.authSignin);
router.post('/signout', ctrl.authSignout);

module.exports = router;
