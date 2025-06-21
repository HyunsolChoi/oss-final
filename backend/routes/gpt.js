const express= require('express');
const router= express.Router();
const ctrl= require('../controllers/gptController');

router.post('/consulting',  ctrl.getConsultingContext);
router.post('/generate-questions', ctrl.generateGPTQuestions);
router.post('/update-qa', ctrl.updateQuestionsAndAnswers);
router.post('/keywords', ctrl.processUserKeywords);

module.exports = router;