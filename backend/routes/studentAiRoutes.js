/**
 * 学生 AI 助手路由
 * 仅包含 AI 问答、练习、聊天历史相关路由
 * 挂载到 /student/ai
 */
const router = require('express').Router();
const { askLearningAssistant, generatePracticeQuestions, submitPracticeAnswer } = require('../controllers/student-ai-controller.js');
const { streamLearningAssistant, chatLearningAssistant, getChatHistory, clearChatHistory } = require('../controllers/streamingLearningAssistant-controller.js');

// AI 问答
router.post('/ask', askLearningAssistant);
router.post('/ask/stream', streamLearningAssistant);
router.post('/chat', chatLearningAssistant);

// 练习
router.post('/practice/generate', generatePracticeQuestions);
router.post('/practice/submit', submitPracticeAnswer);

// 聊天历史
router.get('/:studentId/chat/:conversationId/history', getChatHistory);
router.delete('/:studentId/chat/:conversationId/history', clearChatHistory);

module.exports = router;
