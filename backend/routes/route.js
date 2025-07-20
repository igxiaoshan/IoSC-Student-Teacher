const router = require('express').Router();

// const { adminRegister, adminLogIn, deleteAdmin, getAdminDetail, updateAdmin } = require('../controllers/admin-controller.js');

const { adminRegister, adminLogIn, getAdminDetail} = require('../controllers/admin-controller.js');

const { sclassCreate, sclassList, deleteSclass, deleteSclasses, getSclassDetail, getSclassStudents, getSclassTeachers, updateSclass, batchDeleteSclasses, getClassStatistics } = require('../controllers/class-controller.js');
const { createClassValidation, updateClassValidation, getClassValidation, getClassListValidation, batchDeleteValidation, handleValidationErrors } = require('../validation/classValidation.js');
const { complainCreate, complainList } = require('../controllers/complain-controller.js');
const { noticeCreate, noticeList, deleteNotices, deleteNotice, updateNotice } = require('../controllers/notice-controller.js');
const {
    studentRegister,
    studentLogIn,
    getStudents,
    getStudentDetail,
    deleteStudents,
    deleteStudent,
    updateStudent,
    studentAttendance,
    deleteStudentsByClass,
    updateExamResult,
    clearAllStudentsAttendanceBySubject,
    clearAllStudentsAttendance,
    removeStudentAttendanceBySubject,
    removeStudentAttendance } = require('../controllers/student_controller.js');
const { subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail, deleteSubject, freeSubjectList, allSubjects, deleteSubjects, updateSubject, addClassToSubject, removeClassFromSubject, getSubjectStatistics } = require('../controllers/subject-controller.js');
const { teacherRegister, teacherLogIn, getTeachers, getTeacherDetail, deleteTeachers, deleteTeachersByClass, deleteTeacher, updateTeacherSubject, teacherAttendance, addClassToTeacher, removeClassFromTeacher, getTeacherStatistics } = require('../controllers/teacher-controller.js');

// 学生科目管理控制器
const { getStudentSubjects, getAvailableSubjects, selectSubject, unselectSubject, updateLearningPreferences, autoAssignClassSubjects } = require('../controllers/studentSubject-controller.js');

// 流式学习助手控制器
const { streamLearningAssistant, chatLearningAssistant, getChatHistory, clearChatHistory } = require('../controllers/streamingLearningAssistant-controller.js');

// 学生日历控制器
const { getStudentCalendar, syncCoursesToCalendar, syncExamsToCalendar, addPersonalEvent, updateEventStatus, getCalendarStatistics, generateAIStudyPlan } = require('../controllers/studentCalendar-controller.js');

// AI功能控制器
const {
    generateCourseware,
    getTeacherCourseware,
    getTeacherCoursewareHistory,
    updateCourseware,
    deleteCourseware,
    publishCourseware,
    adjustCoursewareContent,
    exportCourseware,
    exportCoursewareToWord,
    generateShareLink,
    downloadByShareLink
} = require('../controllers/ai-courseware-controller.js');
const {
    generateAssessment,
    getTeacherAssessments,
    getTeacherAssessmentHistory,
    updateAssessment,
    deleteAssessment,
    exportAssessmentToWord,
    exportAssessmentDataToWord,
    generateAssessmentShareLink,
    getAssessmentByShareLink,
    publishAssessment
} = require('../controllers/ai-assessment-controller.js');
const { analyzeSubmission, getClassAnalysisReport, batchAnalyzeSubmissions, generatePersonalizedRecommendations } = require('../controllers/ai-analysis-controller.js');
const { upload, uploadCourseDocument, deleteCourseDocument, getCourseDocuments, downloadCourseDocument } = require('../controllers/file-upload-controller.js');
const { askLearningAssistant, generatePracticeQuestions, submitPracticeAnswer } = require('../controllers/student-ai-controller.js');

// 仪表盘路由
const adminDashboardRoutes = require('./adminDashboard.js');

// Admin
router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);

router.get("/Admin/:id", getAdminDetail)
// router.delete("/Admin/:id", deleteAdmin)

// router.put("/Admin/:id", updateAdmin)

// Student

router.post('/StudentReg', studentRegister);
router.post('/StudentLogin', studentLogIn)

router.get("/Students/:id", getStudents)
router.get("/Student/:id", getStudentDetail)

router.delete("/Students/:id", deleteStudents)
router.delete("/StudentsClass/:id", deleteStudentsByClass)
router.delete("/Student/:id", deleteStudent)

router.put("/Student/:id", updateStudent)

router.put('/UpdateExamResult/:id', updateExamResult)

router.put('/StudentAttendance/:id', studentAttendance)

router.put('/RemoveAllStudentsSubAtten/:id', clearAllStudentsAttendanceBySubject);
router.put('/RemoveAllStudentsAtten/:id', clearAllStudentsAttendance);

router.put('/RemoveStudentSubAtten/:id', removeStudentAttendanceBySubject);
router.put('/RemoveStudentAtten/:id', removeStudentAttendance)

// Teacher - 教师管理路由

// 教师注册和登录
router.post('/TeacherReg', teacherRegister);
router.post('/TeacherLogin', teacherLogIn)

// 获取教师列表和详情 (支持分页、搜索、筛选)
router.get("/Teachers/:id", getTeachers)
router.get("/Teacher/:id", getTeacherDetail)

// 获取教师统计信息
router.get("/TeacherStats/:id", getTeacherStatistics);

// 更新教师信息
router.put("/TeacherSubject", updateTeacherSubject)

// 教师班级关联管理
router.post("/Teacher/addClass", addClassToTeacher);
router.delete("/Teacher/removeClass", removeClassFromTeacher);

// 删除教师
router.delete("/Teachers/:id", deleteTeachers)
router.delete("/TeachersClass/:id", deleteTeachersByClass)
router.delete("/Teacher/:id", deleteTeacher)

// 教师考勤
router.post('/TeacherAttendance/:id', teacherAttendance)

// Notice

router.post('/NoticeCreate', noticeCreate);

router.get('/NoticeList/:id', noticeList);

router.delete("/Notices/:id", deleteNotices)
router.delete("/Notice/:id", deleteNotice)

router.put("/Notice/:id", updateNotice)

// Complain

router.post('/ComplainCreate', complainCreate);

router.get('/ComplainList/:id', complainList);

// Sclass - 班级管理路由

// 创建班级 (带验证)
router.post('/SclassCreate', createClassValidation, handleValidationErrors, sclassCreate);

// 获取班级列表 (带分页、搜索、筛选)
router.get('/SclassList/:id', getClassListValidation, handleValidationErrors, sclassList);

// 获取班级详情
router.get("/Sclass/:id", getClassValidation, handleValidationErrors, getSclassDetail);

// 获取班级学生列表
router.get("/Sclass/Students/:id", getClassValidation, handleValidationErrors, getSclassStudents);

// 获取班级教师列表
router.get("/Sclass/Teachers/:id", getClassValidation, handleValidationErrors, getSclassTeachers);

// 获取班级统计信息
router.get("/SclassStats/:id", getClassListValidation, handleValidationErrors, getClassStatistics);

// 更新班级信息
router.put("/Sclass/:id", updateClassValidation, handleValidationErrors, updateSclass);

// 删除单个班级
router.delete("/Sclass/:id", getClassValidation, handleValidationErrors, deleteSclass);

// 删除学校所有班级
router.delete("/Sclasses/:id", getClassListValidation, handleValidationErrors, deleteSclasses);

// 批量删除班级
router.delete("/SclassBatch/:schoolId", batchDeleteValidation, handleValidationErrors, batchDeleteSclasses);

// Subject - 科目管理路由

// 创建科目
router.post('/SubjectCreate', subjectCreate);

// 获取科目列表 (支持分页、搜索、筛选)
router.get('/AllSubjects/:id', allSubjects);
router.get('/ClassSubjects/:id', classSubjects);
router.get('/FreeSubjectList/:id', freeSubjectList);

// 获取科目详情
router.get("/Subject/:id", getSubjectDetail);
router.get("/Subject/Detail/:id", getSubjectDetail); // 兼容前端调用

// 获取科目统计信息
router.get("/SubjectStats/:id", getSubjectStatistics);

// 更新科目信息
router.put("/Subject/:id", updateSubject);

// 科目班级关联管理
router.post("/Subject/addClass", addClassToSubject);
router.delete("/Subject/removeClass", removeClassFromSubject);

// 删除科目
router.delete("/Subject/:id", deleteSubject);
router.delete("/Subjects/:id", deleteSubjects);
router.delete("/SubjectsClass/:id", deleteSubjectsByClass);

// 文件上传路由
router.post('/upload/courseware-document', upload.single('document'), uploadCourseDocument);
router.delete('/upload/courseware/:coursewareId/document/:documentId', deleteCourseDocument);
router.get('/upload/courseware/:coursewareId/documents', getCourseDocuments);
router.get('/upload/courseware/:coursewareId/document/:documentId/download', downloadCourseDocument);

// AI课件生成路由
router.post('/ai/courseware/generate', generateCourseware);
router.get('/ai/courseware/teacher/:teacherId', getTeacherCourseware);
router.get('/ai/courseware/teacher/:teacherId/history', getTeacherCoursewareHistory);
router.put('/ai/courseware/:id', updateCourseware);
router.delete('/ai/courseware/:id', deleteCourseware);
router.put('/ai/courseware/:id/publish', publishCourseware);
router.put('/ai/courseware/:id/adjust', adjustCoursewareContent);
router.get('/ai/courseware/:id/export', exportCourseware);
router.get('/ai/courseware/:id/export/word', exportCoursewareToWord);
router.post('/ai/courseware/:id/share', generateShareLink);
router.get('/ai/courseware/share/:token', downloadByShareLink);

// AI考核生成路由
router.post('/ai/assessment/generate', generateAssessment);
router.get('/ai/assessment/teacher/:teacherId', getTeacherAssessments);
router.get('/ai/assessment/teacher/:teacherId/history', getTeacherAssessmentHistory);
router.put('/ai/assessment/:id', updateAssessment);
router.delete('/ai/assessment/:id', deleteAssessment);
router.get('/ai/assessment/:id/export/word', exportAssessmentToWord);
router.post('/ai/assessment/export/word', exportAssessmentDataToWord);
router.post('/ai/assessment/:id/share', generateAssessmentShareLink);
router.get('/ai/assessment/share/:token', getAssessmentByShareLink);
router.put('/ai/assessment/:id/publish', publishAssessment);

// AI实训练习路由
router.use('/ai/practical-exercise', require('./practicalExercise'));

// AI学情分析路由
router.post('/ai/analysis/submission/:submissionId', analyzeSubmission);
router.get('/ai/analysis/class/:teacherId/:subjectId/:assessmentId', getClassAnalysisReport);
router.post('/ai/analysis/batch/:assessmentId/:teacherId', batchAnalyzeSubmissions);
router.get('/ai/analysis/recommendations/:studentId/:subjectId', generatePersonalizedRecommendations);

// 学生AI助手路由
router.post('/student/ai/ask', askLearningAssistant);
router.post('/student/ai/practice/generate', generatePracticeQuestions);
router.post('/student/ai/practice/submit', submitPracticeAnswer);

// Dify服务测试路由
router.get('/dify/test', async (req, res) => {
    const difyService = require('../services/difyService');
    try {
        const testResult = await difyService.testConnection();
        const serviceInfo = difyService.getServiceInfo();

        res.json({
            success: testResult.success,
            message: testResult.message,
            serviceInfo: serviceInfo,
            testResponse: testResult.response
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Dify服务测试失败',
            error: error.message
        });
    }
});

router.get('/dify/info', (req, res) => {
    const difyService = require('../services/difyService');
    const serviceInfo = difyService.getServiceInfo();

    res.json({
        success: true,
        serviceInfo: serviceInfo
    });
});

// 学生科目管理路由
router.get('/student/:studentId/subjects', getStudentSubjects);
router.get('/student/:studentId/subjects/available', getAvailableSubjects);
router.post('/student/:studentId/subjects/select', selectSubject);
router.delete('/student/:studentId/subjects/:subjectId', unselectSubject);
router.put('/student/:studentId/subjects/:subjectId/preferences', updateLearningPreferences);
router.post('/student/:studentId/subjects/auto-assign', autoAssignClassSubjects);

// 流式学习助手路由
router.post('/student/ai/ask/stream', streamLearningAssistant);
router.post('/student/ai/ask', chatLearningAssistant);
router.get('/student/:studentId/chat/:conversationId/history', getChatHistory);
router.delete('/student/:studentId/chat/:conversationId/history', clearChatHistory);

// 学生日历路由
router.get('/student/:studentId/calendar', getStudentCalendar);
router.post('/student/:studentId/calendar/sync/courses', syncCoursesToCalendar);
router.post('/student/:studentId/calendar/sync/exams', syncExamsToCalendar);
router.post('/student/:studentId/calendar/events', addPersonalEvent);
router.put('/student/:studentId/calendar/events/:eventId/status', updateEventStatus);
router.get('/student/:studentId/calendar/statistics', getCalendarStatistics);
router.post('/student/:studentId/calendar/ai/study-plan', generateAIStudyPlan);

// 管理员仪表盘路由
router.use('/adminDashboard', adminDashboardRoutes);

module.exports = router;