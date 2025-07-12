const express = require('express');
const router = express.Router();
const {
    getCompanionStatus,
    chatWithCompanion,
    getEncouragement,
    setLearningGoals,
    getLearningReminders,
    recordAchievement
} = require('../controllers/learningCompanion-controller');

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

// 获取学习伙伴状态
router.get('/:studentId/status',
    aiCacheMiddleware((req) => `companion_status:${req.params.studentId}:${new Date().toDateString()}`),
    getCompanionStatus
);

// 与学习伙伴对话
router.post('/:studentId/chat',
    aiRateLimit,
    aiFeatureToggle('chatbot'),
    chatWithCompanion
);

// 获取学习鼓励
router.get('/:studentId/encouragement',
    aiRateLimit,
    aiFeatureToggle('chatbot'),
    getEncouragement
);

// 设置学习目标
router.post('/:studentId/goals',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    setLearningGoals
);

// 获取学习提醒
router.get('/:studentId/reminders',
    aiCacheMiddleware((req) => `learning_reminders:${req.params.studentId}:${new Date().toDateString()}`),
    getLearningReminders
);

// 记录学习成就
router.post('/:studentId/achievement',
    recordAchievement
);

module.exports = router;
