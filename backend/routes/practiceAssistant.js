const express = require('express');
const router = express.Router();
const {
    startPracticeSession,
    submitPracticeAnswer,
    getPracticeHint,
    completePracticeSession,
    getPracticeHistory
} = require('../controllers/practiceAssistant-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 开始练习会话
router.post('/session/start',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    startPracticeSession
);

// 提交练习答案
router.post('/session/submit',
    aiRateLimit,
    aiFeatureToggle('answerAnalysis'),
    submitPracticeAnswer
);

// 获取练习提示
router.post('/session/hint',
    aiRateLimit,
    aiFeatureToggle('chatbot'),
    getPracticeHint
);

// 完成练习会话
router.post('/session/:sessionId/complete',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    completePracticeSession
);

// 获取练习历史
router.get('/history/:studentId',
    aiCacheMiddleware((req) => `practice_history:${req.params.studentId}:${req.query.subject}:${req.query.page}`),
    getPracticeHistory
);

module.exports = router;
