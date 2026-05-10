/**
 * 主路由文件
 * 统一挂载各模块路由
 */
const router = require('express').Router();
const difyService = require('../services/difyService');

// 模块化路由
const adminRoutes = require('./adminRoutes');
const studentRoutes = require('./studentRoutes');
const teacherRoutes = require('./teacherRoutes');
const classRoutes = require('./classRoutes');
const subjectRoutes = require('./subjectRoutes');
const aiRoutes = require('./aiRoutes');
const studentAiRoutes = require('./studentAiRoutes');
const studentSubjectRoutes = require('./studentSubjectRoutes');
const studentCalendarRoutes = require('./studentCalendarRoutes');
const noticeRoutes = require('./noticeRoutes');
const adminDashboardRoutes = require('./adminDashboard');
const studentDashboardRoutes = require('./studentDashboard');

// ============================================
// 用户管理路由
// ============================================

// 管理员
router.use('/', adminRoutes);

// 学生
router.use('/', studentRoutes);

// 教师
router.use('/', teacherRoutes);

// 班级
router.use('/', classRoutes);

// 科目
router.use('/', subjectRoutes);

// 通知和投诉
router.use('/', noticeRoutes);

// ============================================
// AI 功能路由
// ============================================

router.use('/ai', aiRoutes);

// 学生 AI 助手
router.use('/student/ai', studentAiRoutes);

// 实训练习
router.use('/ai/practical-exercise', require('./practicalExercise'));

// 学习路径
router.use('/learning-path', require('./learningPath'));

// ============================================
// 学生功能路由
// ============================================

// 学生科目
router.use('/student', studentSubjectRoutes);

// 学生日历
router.use('/student', studentCalendarRoutes);

// ============================================
// 仪表盘路由
// ============================================

router.use('/adminDashboard', adminDashboardRoutes);
router.use('/student-dashboard', studentDashboardRoutes);

// ============================================
// 第三方服务路由
// ============================================

// 即梦 AI
router.use('/api/jimeng', require('./jimeng'));

// 知识视频
router.use('/api/knowledge', require('./knowledgeVideo'));

// ============================================
// 服务测试路由
// ============================================

// Dify 服务测试
router.get('/dify/test', async (req, res) => {
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

// Dify 服务信息
router.get('/dify/info', (req, res) => {
    const serviceInfo = difyService.getServiceInfo();
    res.json({
        success: true,
        serviceInfo: serviceInfo
    });
});

module.exports = router;