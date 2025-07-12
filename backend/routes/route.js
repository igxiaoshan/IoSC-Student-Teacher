const router = require('express').Router();

// const { adminRegister, adminLogIn, deleteAdmin, getAdminDetail, updateAdmin } = require('../controllers/admin-controller.js');

const { adminRegister, adminLogIn, getAdminDetail} = require('../controllers/admin-controller.js');

const { sclassCreate, sclassList, deleteSclass, deleteSclasses, getSclassDetail, getSclassStudents, updateSclass } = require('../controllers/class-controller.js');
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
const { subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail, deleteSubject, freeSubjectList, allSubjects, deleteSubjects, updateSubject } = require('../controllers/subject-controller.js');
const { teacherRegister, teacherLogIn, getTeachers, getTeacherDetail, deleteTeachers, deleteTeachersByClass, deleteTeacher, updateTeacherSubject, teacherAttendance } = require('../controllers/teacher-controller.js');

// AI功能控制器
const { generateCourseware, getTeacherCourseware, updateCourseware, deleteCourseware, publishCourseware, adjustCoursewareContent, exportCourseware } = require('../controllers/ai-courseware-controller.js');
const { generateAssessment, getTeacherAssessments, updateAssessment, publishAssessment } = require('../controllers/ai-assessment-controller.js');
const { analyzeSubmission, getClassAnalysisReport, batchAnalyzeSubmissions, generatePersonalizedRecommendations } = require('../controllers/ai-analysis-controller.js');
const { upload, uploadCourseDocument, deleteCourseDocument, getCourseDocuments, downloadCourseDocument } = require('../controllers/file-upload-controller.js');
const { askLearningAssistant, generatePracticeQuestions, submitPracticeAnswer } = require('../controllers/student-ai-controller.js');

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

// Teacher

router.post('/TeacherReg', teacherRegister);
router.post('/TeacherLogin', teacherLogIn)

router.get("/Teachers/:id", getTeachers)
router.get("/Teacher/:id", getTeacherDetail)

router.delete("/Teachers/:id", deleteTeachers)
router.delete("/TeachersClass/:id", deleteTeachersByClass)
router.delete("/Teacher/:id", deleteTeacher)

router.put("/TeacherSubject", updateTeacherSubject)

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

// Sclass

router.post('/SclassCreate', sclassCreate);

router.get('/SclassList/:id', sclassList);
router.get("/Sclass/:id", getSclassDetail)

router.get("/Sclass/Students/:id", getSclassStudents)

router.delete("/Sclasses/:id", deleteSclasses)
router.delete("/Sclass/:id", deleteSclass)
router.put("/Sclass/:id", updateSclass)

// Subject

router.post('/SubjectCreate', subjectCreate);

router.get('/AllSubjects/:id', allSubjects);
router.get('/ClassSubjects/:id', classSubjects);
router.get('/FreeSubjectList/:id', freeSubjectList);
router.get("/Subject/:id", getSubjectDetail)

router.delete("/Subject/:id", deleteSubject)
router.delete("/Subjects/:id", deleteSubjects)
router.delete("/SubjectsClass/:id", deleteSubjectsByClass)
router.put("/Subject/:id", updateSubject)

// 文件上传路由
router.post('/upload/courseware-document', upload.single('document'), uploadCourseDocument);
router.delete('/upload/courseware/:coursewareId/document/:documentId', deleteCourseDocument);
router.get('/upload/courseware/:coursewareId/documents', getCourseDocuments);
router.get('/upload/courseware/:coursewareId/document/:documentId/download', downloadCourseDocument);

// AI课件生成路由
router.post('/ai/courseware/generate', generateCourseware);
router.get('/ai/courseware/teacher/:teacherId', getTeacherCourseware);
router.put('/ai/courseware/:id', updateCourseware);
router.delete('/ai/courseware/:id', deleteCourseware);
router.put('/ai/courseware/:id/publish', publishCourseware);
router.put('/ai/courseware/:id/adjust', adjustCoursewareContent);
router.get('/ai/courseware/:id/export', exportCourseware);

// AI考核生成路由
router.post('/ai/assessment/generate', generateAssessment);
router.get('/ai/assessment/teacher/:teacherId', getTeacherAssessments);
router.put('/ai/assessment/:id', updateAssessment);
router.put('/ai/assessment/:id/publish', publishAssessment);

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

module.exports = router;