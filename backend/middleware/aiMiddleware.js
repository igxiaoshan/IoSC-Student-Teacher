// AI相关的中间件
const rateLimit = require('express-rate-limit');

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

// 简单的日志中间件
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
    logAIRequests,
    validateAIRequest
};
