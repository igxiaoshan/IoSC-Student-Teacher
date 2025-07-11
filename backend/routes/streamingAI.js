const router = require('express').Router();
const {
    streamStudyAssistant,
    streamLearningCompanion
} = require('../controllers/streamingAI-controller');

// 流式学习助手API
router.post('/study-assistant/:studentId/stream', streamStudyAssistant);

// 流式学习伙伴API
router.post('/learning-companion/:studentId/stream', streamLearningCompanion);

module.exports = router;
