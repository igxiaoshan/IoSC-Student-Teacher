const express = require('express');
const router = express.Router();
const {
    createKnowledgeBase,
    uploadKnowledgeBaseFile,
    getKnowledgeBases,
    getKnowledgeBaseById,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    searchKnowledgeBase,
    getKnowledgeBaseStats
} = require('../controllers/knowledgeBase-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

const { knowledgeBaseQueryValidation } = require('../validation/aiValidation');
const { aiValidationMiddleware } = require('../middleware/aiMiddleware');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 创建知识库条目
router.post('/create', createKnowledgeBase);

// 上传文件到知识库
router.post('/upload', uploadKnowledgeBaseFile);

// 获取知识库列表
router.get('/school/:adminID', getKnowledgeBases);

// 获取单个知识库条目
router.get('/:id', getKnowledgeBaseById);

// 更新知识库条目
router.put('/:id', updateKnowledgeBase);

// 删除知识库条目
router.delete('/:id', deleteKnowledgeBase);

// 搜索知识库 (使用AI增强)
router.post('/search/:adminID', 
    aiRateLimit,
    aiFeatureToggle('chatbot'),
    aiCacheMiddleware(generateCacheKey.knowledgeBaseQuery),
    searchKnowledgeBase
);

// 获取知识库统计信息
router.get('/stats/:adminID', getKnowledgeBaseStats);

module.exports = router;
