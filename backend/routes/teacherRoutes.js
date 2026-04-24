/**
 * 教师路由
 */
const router = require('express').Router();
const {
    teacherRegister, teacherLogIn, getTeachers, getTeacherDetail,
    deleteTeachers, deleteTeachersByClass, deleteTeacher,
    updateTeacherSubject, teacherAttendance, addClassToTeacher,
    removeClassFromTeacher, getTeacherStatistics
} = require('../controllers/teacher-controller.js');

// 注册和登录
router.post('/TeacherReg', teacherRegister);
router.post('/TeacherLogin', teacherLogIn);

// 列表和详情
router.get('/Teachers/:id', getTeachers);
router.get('/Teacher/:id', getTeacherDetail);
router.get('/TeacherStats/:id', getTeacherStatistics);

// 更新
router.put('/TeacherSubject', updateTeacherSubject);

// 班级关联
router.post('/Teacher/addClass', addClassToTeacher);
router.delete('/Teacher/removeClass', removeClassFromTeacher);

// 删除
router.delete('/Teachers/:id', deleteTeachers);
router.delete('/TeachersClass/:id', deleteTeachersByClass);
router.delete('/Teacher/:id', deleteTeacher);

// 考勤
router.post('/TeacherAttendance/:id', teacherAttendance);

module.exports = router;
