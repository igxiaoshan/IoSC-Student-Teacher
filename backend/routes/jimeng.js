const router = require('express').Router();
const {
    generateImage,
    generateVideo,
    getTaskStatus,
    getModels,
    getUserHistory,
    getStatus,
} = require('../controllers/jimengController');

/**
 * 即梦AI路由
 */

// 获取服务状态
router.get('/status', getStatus);

// 文生图
router.post('/text-to-image', generateImage);

// 文生视频
router.post('/text-to-video', generateVideo);

// 查询任务状态
router.get('/task/:taskId', getTaskStatus);

// 获取模型列表
router.get('/models', getModels);

// 获取用户历史记录
router.get('/history/:userId', getUserHistory);

module.exports = router;
