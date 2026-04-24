/**
 * AI 功能路由
 */
const router = require('express').Router();
const {
    generateCourseware, getTeacherCourseware, getTeacherCoursewareHistory,
    updateCourseware, deleteCourseware, publishCourseware,
    adjustCoursewareContent, exportCourseware, exportCoursewareToWord,
    generateShareLink, downloadByShareLink
} = require('../controllers/ai-courseware-controller.js');
const {
    generateAssessment, getTeacherAssessments, getTeacherAssessmentHistory,
    updateAssessment, deleteAssessment, exportAssessmentToWord,
    exportAssessmentDataToWord, generateAssessmentShareLink,
    getAssessmentByShareLink, publishAssessment
} = require('../controllers/ai-assessment-controller.js');
const { analyzeSubmission, getClassAnalysisReport, batchAnalyzeSubmissions, generatePersonalizedRecommendations } = require('../controllers/ai-analysis-controller.js');
const { upload, uploadCourseDocument, deleteCourseDocument, getCourseDocuments, downloadCourseDocument } = require('../controllers/file-upload-controller.js');

// 文件上传
router.post('/upload/courseware-document', upload.single('document'), uploadCourseDocument);
router.delete('/upload/courseware/:coursewareId/document/:documentId', deleteCourseDocument);
router.get('/upload/courseware/:coursewareId/documents', getCourseDocuments);
router.get('/upload/courseware/:coursewareId/document/:documentId/download', downloadCourseDocument);

// 课件生成
router.post('/courseware/generate', generateCourseware);
router.get('/courseware/teacher/:teacherId', getTeacherCourseware);
router.get('/courseware/teacher/:teacherId/history', getTeacherCoursewareHistory);
router.put('/courseware/:id', updateCourseware);
router.delete('/courseware/:id', deleteCourseware);
router.put('/courseware/:id/publish', publishCourseware);
router.put('/courseware/:id/adjust', adjustCoursewareContent);
router.get('/courseware/:id/export', exportCourseware);
router.get('/courseware/:id/export/word', exportCoursewareToWord);
router.post('/courseware/:id/share', generateShareLink);
router.get('/courseware/share/:token', downloadByShareLink);

// 考核生成
router.post('/assessment/generate', generateAssessment);
router.get('/assessment/teacher/:teacherId', getTeacherAssessments);
router.get('/assessment/teacher/:teacherId/history', getTeacherAssessmentHistory);
router.put('/assessment/:id', updateAssessment);
router.delete('/assessment/:id', deleteAssessment);
router.get('/assessment/:id/export/word', exportAssessmentToWord);
router.post('/assessment/export/word', exportAssessmentDataToWord);
router.post('/assessment/:id/share', generateAssessmentShareLink);
router.get('/assessment/share/:token', getAssessmentByShareLink);
router.put('/assessment/:id/publish', publishAssessment);

// 学情分析
router.post('/analysis/submission/:submissionId', analyzeSubmission);
router.get('/analysis/class/:teacherId/:subjectId/:assessmentId', getClassAnalysisReport);
router.post('/analysis/batch/:assessmentId/:teacherId', batchAnalyzeSubmissions);
router.get('/analysis/recommendations/:studentId/:subjectId', generatePersonalizedRecommendations);

// 实训练习
router.use('/practical-exercise', require('./practicalExercise'));

module.exports = router;
