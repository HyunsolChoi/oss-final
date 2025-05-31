const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/userController');

router.put('/profile', ctrl.updateProfile);

router.get('/profile', ctrl.getUserProfile);

module.exports = router;