const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/gpt');

router.get('/output',  ctrl.getConsulting);


module.exports = router;
