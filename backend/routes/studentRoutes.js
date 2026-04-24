/**
 * 学生路由
 */
const router = require('express').Router();
const {
    studentRegister, studentLogIn, getStudents, getStudentDetail,
    deleteStudents, deleteStudent, updateStudent, studentAttendance,
    deleteStudentsByClass, updateExamResult,
    clearAllStudentsAttendanceBySubject, clearAllStudentsAttendance,
    removeStudentAttendanceBySubject, removeStudentAttendance,
    batchAttendance, getClassAttendanceStats, getClassGradeStats, getStudentProgress,
    getClassOverviewStats
} = require('../controllers/student_controller.js');

// 注册和登录
router.post('/StudentReg', studentRegister);
router.post('/StudentLogin', studentLogIn);

// CRUD
router.get('/Students/:id', getStudents);
router.get('/Student/:id', getStudentDetail);
router.put('/Student/:id', updateStudent);
router.delete('/Students/:id', deleteStudents);
router.delete('/StudentsClass/:id', deleteStudentsByClass);
router.delete('/Student/:id', deleteStudent);

// 考试和考勤
router.put('/UpdateExamResult/:id', updateExamResult);
router.put('/StudentAttendance/:id', studentAttendance);
router.put('/RemoveAllStudentsSubAtten/:id', clearAllStudentsAttendanceBySubject);
router.put('/RemoveAllStudentsAtten/:id', clearAllStudentsAttendance);
router.put('/RemoveStudentSubAtten/:id', removeStudentAttendanceBySubject);
router.put('/RemoveStudentAtten/:id', removeStudentAttendance);

// 批量操作和统计 API
router.post('/BatchAttendance', batchAttendance);
router.get('/ClassAttendanceStats', getClassAttendanceStats);
router.get('/ClassGradeStats', getClassGradeStats);
router.get('/StudentProgress', getStudentProgress);
router.get('/ClassOverviewStats/:id', getClassOverviewStats);

module.exports = router;
