const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/authController');

router.post('/signin', ctrl.authSignin);
router.post('/signout', ctrl.authSignout);
router.post('/check-email', ctrl.checkDuplicateEmail);
router.post('/change-password', ctrl.authChangePassword);
router.post('/check-id', ctrl.checkDuplicateId);
router.post('/signup', ctrl.authSignup);

module.exports = router;
