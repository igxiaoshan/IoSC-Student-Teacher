const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const aiConfig = require('../config/aiConfig');

// 创建缓存实例
const aiCache = new NodeCache({
    stdTTL: aiConfig.cache.ttl,
    maxKeys: aiConfig.cache.maxSize,
    useClones: false
});

/**
 * AI服务限流中间件
 */
const aiRateLimit = rateLimit({
    windowMs: aiConfig.rateLimit.windowMs,
    max: aiConfig.rateLimit.max,
    message: {
        error: aiConfig.rateLimit.message,
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // 根据用户ID进行限流
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    }
});

/**
 * AI请求缓存中间件
 */
const aiCacheMiddleware = (cacheKeyGenerator) => {
    return (req, res, next) => {
        if (!aiConfig.cache.enabled) {
            return next();
        }

        const cacheKey = cacheKeyGenerator(req);
        const cachedResult = aiCache.get(cacheKey);

        if (cachedResult) {
            console.log(`AI Cache hit for key: ${cacheKey}`);
            return res.json({
                ...cachedResult,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        // 重写res.json以缓存响应
        const originalJson = res.json;
        res.json = function(data) {
            if (data && !data.error && res.statusCode === 200) {
                aiCache.set(cacheKey, data);
                console.log(`AI Cache set for key: ${cacheKey}`);
            }
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * AI请求日志中间件
 */
const aiLoggingMiddleware = (req, res, next) => {
    if (!aiConfig.logging.enabled) {
        return next();
    }

    const startTime = Date.now();
    const originalJson = res.json;

    // 记录请求
    if (aiConfig.logging.logRequests) {
        console.log(`[AI Request] ${req.method} ${req.path}`, {
            user: req.user?.id,
            timestamp: new Date().toISOString(),
            body: req.body
        });
    }

    // 重写响应以记录日志
    res.json = function(data) {
        const duration = Date.now() - startTime;
        
        if (aiConfig.logging.logResponses) {
            console.log(`[AI Response] ${req.method} ${req.path}`, {
                duration: `${duration}ms`,
                status: res.statusCode,
                success: !data.error,
                timestamp: new Date().toISOString(),
                response: data
            });
        } else {
            console.log(`[AI Response] ${req.method} ${req.path}`, {
                duration: `${duration}ms`,
                status: res.statusCode,
                success: !data.error,
                timestamp: new Date().toISOString()
            });
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * AI请求验证中间件
 */
const aiValidationMiddleware = (validationSchema) => {
    return (req, res, next) => {
        const { error } = validationSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: error.details.map(detail => detail.message),
                code: 'VALIDATION_ERROR'
            });
        }

        next();
    };
};

/**
 * AI功能开关中间件
 */
const aiFeatureToggle = (featureName) => {
    return (req, res, next) => {
        if (!aiConfig.features[featureName]) {
            return res.status(503).json({
                error: `AI feature '${featureName}' is currently disabled`,
                code: 'FEATURE_DISABLED'
            });
        }
        next();
    };
};

/**
 * 内容过滤中间件
 */
const contentFilterMiddleware = (req, res, next) => {
    if (!aiConfig.contentFilter.enabled) {
        return next();
    }

    const filterContent = (text) => {
        if (!text || typeof text !== 'string') return text;

        // 长度检查
        if (text.length > aiConfig.contentFilter.maxLength) {
            throw new Error(`Content too long. Maximum ${aiConfig.contentFilter.maxLength} characters allowed.`);
        }

        // 敏感词过滤
        let filteredText = text;
        aiConfig.contentFilter.bannedWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            filteredText = filteredText.replace(regex, '***');
        });

        // HTML清理（如果启用）
        if (aiConfig.contentFilter.sanitizeHtml) {
            // 简单的HTML标签移除
            filteredText = filteredText.replace(/<[^>]*>/g, '');
        }

        return filteredText;
    };

    try {
        // 过滤请求体中的文本内容
        if (req.body) {
            const filterObject = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = filterContent(obj[key]);
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        filterObject(obj[key]);
                    }
                }
            };
            filterObject(req.body);
        }

        next();
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            code: 'CONTENT_FILTER_ERROR'
        });
    }
};

/**
 * AI错误处理中间件
 */
const aiErrorHandler = (err, req, res, next) => {
    console.error('[AI Error]', err);

    // AI服务特定错误
    if (err.code === 'AI_SERVICE_ERROR') {
        return res.status(503).json({
            error: 'AI service is temporarily unavailable',
            message: aiConfig.errorHandling.fallbackMessages[err.feature] || 'Please try again later',
            code: 'AI_SERVICE_UNAVAILABLE'
        });
    }

    // 超时错误
    if (err.code === 'TIMEOUT') {
        return res.status(408).json({
            error: 'AI request timeout',
            message: 'The AI service took too long to respond',
            code: 'AI_TIMEOUT'
        });
    }

    // 限流错误
    if (err.code === 'RATE_LIMIT_EXCEEDED') {
        return res.status(429).json({
            error: 'Too many requests',
            message: aiConfig.rateLimit.message,
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    // 默认错误处理
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
    });
};

/**
 * 生成缓存键的辅助函数
 */
const generateCacheKey = {
    lessonPlan: (req) => {
        const { subject, grade, duration, outline } = req.body;
        return `lesson_plan:${subject}:${grade}:${duration}:${Buffer.from(outline).toString('base64').substring(0, 20)}`;
    },
    
    questionGeneration: (req) => {
        const { subject, difficulty, questionCount, questionTypes } = req.body;
        return `questions:${subject}:${difficulty}:${questionCount}:${questionTypes.join(',')}`;
    },
    
    answerAnalysis: (req) => {
        const { question, answer } = req.body;
        return `analysis:${Buffer.from(question + answer).toString('base64').substring(0, 30)}`;
    },
    
    personalizedExercise: (req) => {
        const { studentId, level, weakPoints } = req.body;
        return `exercise:${studentId}:${level}:${weakPoints.join(',')}`;
    },
    
    performanceAnalysis: (req) => {
        const { studentId, timeRange, subject } = req.body;
        return `performance:${studentId}:${timeRange}:${subject}`;
    }
};

module.exports = {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiValidationMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    aiErrorHandler,
    generateCacheKey,
    aiCache
};
