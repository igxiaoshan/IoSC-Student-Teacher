/**
 * 学生 AI 助手路由
 */
const router = require('express').Router();
const { askLearningAssistant, generatePracticeQuestions, submitPracticeAnswer } = require('../controllers/student-ai-controller.js');
const { getStudentSubjects, getAvailableSubjects, selectSubject, unselectSubject, updateLearningPreferences, autoAssignClassSubjects } = require('../controllers/studentSubject-controller.js');
const { streamLearningAssistant, chatLearningAssistant, getChatHistory, clearChatHistory } = require('../controllers/streamingLearningAssistant-controller.js');
const { getStudentCalendar, syncCoursesToCalendar, syncExamsToCalendar, addPersonalEvent, updateEventStatus, getCalendarStatistics, generateAIStudyPlan } = require('../controllers/studentCalendar-controller.js');

// AI 问答
router.post('/ask', askLearningAssistant);
router.post('/ask/stream', streamLearningAssistant);
router.post('/ask', chatLearningAssistant);

// 练习
router.post('/practice/generate', generatePracticeQuestions);
router.post('/practice/submit', submitPracticeAnswer);

// 聊天历史
router.get('/:studentId/chat/:conversationId/history', getChatHistory);
router.delete('/:studentId/chat/:conversationId/history', clearChatHistory);

// 科目选择
router.get('/:studentId/subjects', getStudentSubjects);
router.get('/:studentId/subjects/available', getAvailableSubjects);
router.post('/:studentId/subjects/select', selectSubject);
router.delete('/:studentId/subjects/:subjectId', unselectSubject);
router.put('/:studentId/subjects/:subjectId/preferences', updateLearningPreferences);
router.post('/:studentId/subjects/auto-assign', autoAssignClassSubjects);

// 日历
router.get('/:studentId/calendar', getStudentCalendar);
router.post('/:studentId/calendar/sync/courses', syncCoursesToCalendar);
router.post('/:studentId/calendar/sync/exams', syncExamsToCalendar);
router.post('/:studentId/calendar/events', addPersonalEvent);
router.put('/:studentId/calendar/events/:eventId/status', updateEventStatus);
router.get('/:studentId/calendar/statistics', getCalendarStatistics);
router.post('/:studentId/calendar/ai/study-plan', generateAIStudyPlan);

module.exports = router;
