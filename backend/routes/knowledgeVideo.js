const express = require('express');
const router = express.Router();
const { generateKnowledgeVideo, getKnowledgeVideoHistory } = require('../controllers/knowledgeVideo-controller');

/**
 * 知识视频生成路由
 */

// 生成知识视频
router.post('/video-generate', generateKnowledgeVideo);

// 获取知识视频历史记录
router.get('/video-history/:userId', getKnowledgeVideoHistory);

module.exports = router;