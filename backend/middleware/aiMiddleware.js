// AI相关的中间件
const rateLimit = require('express-rate-limit');

// 获取AI配置
const getAIConfig = () => {
    try {
        return require('../config/aiConfig');
    } catch (error) {
        // 如果配置文件不存在，返回默认配置
        return {
            features: {
                lessonPlanGeneration: true,
                questionGeneration: true,
                answerAnalysis: true,
                personalizedExercise: true,
                performanceAnalysis: true,
                chatbot: true,
                practicalExercise: true // 新增实训练习功能
            },
            cache: {
                enabled: true,
                ttl: 3600,
                maxSize: 1000
            }
        };
    }
};

// AI请求速率限制
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP在窗口期内最多100个请求
    message: {
        error: 'Too many AI requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// AI功能开关中间件
const aiFeatureToggle = (featureName) => {
    return (req, res, next) => {
        const config = getAIConfig();

        if (config.features && config.features[featureName] !== false) {
            // 功能开启，继续执行
            next();
        } else {
            // 功能关闭，返回错误
            res.status(503).json({
                success: false,
                message: `AI功能 ${featureName} 当前不可用`,
                error: 'Feature disabled'
            });
        }
    };
};

// AI缓存中间件
const aiCacheMiddleware = (keyGenerator) => {
    return (req, res, next) => {
        // 简单的缓存实现，实际项目中可以使用Redis
        const config = getAIConfig();

        if (!config.cache || !config.cache.enabled) {
            return next();
        }

        try {
            const cacheKey = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;

            // 这里可以实现实际的缓存逻辑
            // 暂时直接继续执行
            req.cacheKey = cacheKey;
            next();
        } catch (error) {
            console.error('缓存中间件错误:', error);
            next();
        }
    };
};

// AI日志中间件
const aiLoggingMiddleware = (req, res, next) => {
    if (req.path.includes('/ai/')) {
        console.log(`[AI] ${req.method} ${req.path} - ${new Date().toISOString()}`);

        // 记录请求开始时间
        req.startTime = Date.now();

        // 拦截响应结束事件
        const originalSend = res.send;
        res.send = function(data) {
            const duration = Date.now() - req.startTime;
            console.log(`[AI] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
            originalSend.call(this, data);
        };
    }
    next();
};

// 内容过滤中间件
const contentFilterMiddleware = (req, res, next) => {
    // 简单的内容过滤逻辑
    if (req.body && typeof req.body === 'object') {
        // 这里可以添加敏感词过滤等逻辑
        // 暂时直接通过
    }
    next();
};

// 缓存键生成器
const generateCacheKey = {
    performanceAnalysis: (req) => {
        return `performance:${req.params.studentId || req.params.teacherId}:${req.query.timeRange || 'month'}`;
    },
    questionGeneration: (req) => {
        return `questions:${req.params.teacherId}:${req.body.subject}:${req.body.difficulty}`;
    },
    practicalExercise: (req) => {
        return `practical:${req.params.teacherId}:${req.body.exerciseType}:${req.body.difficulty}`;
    }
};

// 简单的日志中间件（向后兼容）
const logAIRequests = (req, res, next) => {
    if (req.path.includes('/ai/')) {
        console.log(`AI Request: ${req.method} ${req.path} at ${new Date().toISOString()}`);
    }
    next();
};

// 简单的验证中间件
const validateAIRequest = (req, res, next) => {
    // 这里可以添加AI请求的验证逻辑
    next();
};

module.exports = {
    aiRateLimit,
    aiFeatureToggle,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    contentFilterMiddleware,
    generateCacheKey,
    logAIRequests,
    validateAIRequest
};
