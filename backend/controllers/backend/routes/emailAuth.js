const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailController');

router.post('/', ctrl.requestVerificationCode);
router.post('/verify', ctrl.verifyCode);
router.post('/findId', ctrl.findIdVerifyCode);
router.post('/resetPassword', ctrl.resetPassword);

module.exports = router;
