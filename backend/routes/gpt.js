const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/gptContorller');

router.get('/output',  ctrl.getConsulting);


module.exports = router;
