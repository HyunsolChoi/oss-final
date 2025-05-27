const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/gptController');

router.post('/consulting',  ctrl.getConsultingContext);

module.exports = router;