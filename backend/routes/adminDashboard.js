const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getRealtimeDashboard,
    getTeachingQualityAnalysis,
    getLearningEffectivenessAnalysis,
    getResourceUsageAnalysis
} = require('../controllers/adminDashboard-controller');

// 移除AI中间件，使用简单的缓存中间件
const rateLimit = require('express-rate-limit');

// 基础速率限制
const basicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 200, // 增加限制，因为不再是AI请求
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});

// 应用基础中间件
router.use(basicRateLimit);

// 获取管理员仪表板概览
router.get('/:adminID', getAdminDashboard);

// 获取实时数据大屏
router.get('/:adminID/realtime',
    getRealtimeDashboard
);

// 获取教学质量分析
router.get('/:adminID/teaching-quality', getTeachingQualityAnalysis);

// 获取学习效果分析
router.get('/:adminID/learning-effectiveness', getLearningEffectivenessAnalysis);

// 获取资源使用分析
router.get('/:adminID/resource-usage', getResourceUsageAnalysis);

// 测试系统指标端点
router.get('/test/system-metrics', async (req, res) => {
    try {
        const { getSystemMetrics } = require('../controllers/adminDashboard-controller');
        const systemData = await getSystemMetrics();
        res.json(systemData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 测试业务指标端点
router.get('/test/business-metrics', async (req, res) => {
    try {
        const { getBusinessMetrics } = require('../controllers/adminDashboard-controller');
        const timeRanges = {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
            endDate: new Date()
        };
        const businessData = await getBusinessMetrics('test', timeRanges);
        res.json(businessData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
