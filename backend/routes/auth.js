const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/authController');

router.post('/signin', ctrl.authSignin);
router.post('/signout', ctrl.authSignout);
router.post('/check-email', ctrl.authCheckEmail);
router.post('/change-password', ctrl.authChangePassword);

module.exports = router;
