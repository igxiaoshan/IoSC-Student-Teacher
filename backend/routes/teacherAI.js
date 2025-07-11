const router = require('express').Router();
const {
    generateLessonPlan,
    generateExamContent,
    analyzeStudentPerformance,
    streamLessonPlan,
    streamExamGeneration
} = require('../controllers/teacherAI-controller');

// 教师AI功能路由

// 智能备课设计
router.post('/lesson-plan/:teacherId', generateLessonPlan);

// 考核内容生成
router.post('/exam-content/:teacherId', generateExamContent);

// 学情数据分析
router.post('/analytics/:teacherId', analyzeStudentPerformance);

// 流式备课设计
router.post('/lesson-plan/:teacherId/stream', streamLessonPlan);

// 流式考核生成
router.post('/exam-content/:teacherId/stream', streamExamGeneration);

module.exports = router;
