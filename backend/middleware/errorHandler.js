/**
 * 全局异常处理中间件
 * 统一捕获和处理应用中的所有错误
 */
const { errorResponse, serverErrorResponse } = require('../utils/response');

/**
 * 自定义应用错误类
 */
class AppError extends Error {
    constructor(message, statusCode = 400, errorCode = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true; // 标识为可预期的操作错误

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 常见错误类型工厂
 */
const createError = {
    badRequest: (message = '请求参数错误') => new AppError(message, 400, 'BAD_REQUEST'),
    unauthorized: (message = '未授权访问') => new AppError(message, 401, 'UNAUTHORIZED'),
    forbidden: (message = '禁止访问') => new AppError(message, 403, 'FORBIDDEN'),
    notFound: (message = '资源不存在') => new AppError(message, 404, 'NOT_FOUND'),
    conflict: (message = '资源冲突') => new AppError(message, 409, 'CONFLICT'),
    validation: (message = '数据验证失败', errors = null) => {
        const error = new AppError(message, 422, 'VALIDATION_ERROR');
        error.errors = errors;
        return error;
    },
    internal: (message = '服务器内部错误') => new AppError(message, 500, 'INTERNAL_ERROR'),
    serviceUnavailable: (message = '服务暂时不可用') => new AppError(message, 503, 'SERVICE_UNAVAILABLE')
};

/**
 * MongoDB 错误处理
 */
const handleMongoError = (error) => {
    // 重复键错误
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || '字段';
        return createError.conflict(`${field}已存在`);
    }

    // 验证错误
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        return createError.validation('数据验证失败', errors);
    }

    // Cast 错误（无效的 ObjectId）
    if (error.name === 'CastError') {
        return createError.badRequest(`无效的 ${error.path}`);
    }

    return error;
};

/**
 * JWT 错误处理
 */
const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return createError.unauthorized('无效的认证令牌');
    }
    if (error.name === 'TokenExpiredError') {
        return createError.unauthorized('认证令牌已过期');
    }
    return error;
};

/**
 * 全局错误处理中间件
 */
const globalErrorHandler = (err, req, res, next) => {
    // 如果响应已发送，交给默认错误处理
    if (res.headersSent) {
        return next(err);
    }

    let error = err;

    // 处理 MongoDB 错误
    if (err.name === 'MongoError' || err.name === 'MongoServerError' ||
        err.name === 'ValidationError' || err.name === 'CastError') {
        error = handleMongoError(err);
    }

    // 处理 JWT 错误
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = handleJWTError(err);
    }

    // 构建错误响应
    const statusCode = error.statusCode || 500;
    const errorCode = error.errorCode || 'INTERNAL_ERROR';
    const message = error.message || '服务器内部错误';

    // 日志记录
    if (statusCode >= 500) {
        console.error('❌ Server Error:', {
            message: error.message,
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query,
            user: req.user
        });
    } else {
        console.warn('⚠️ Client Error:', {
            message,
            errorCode,
            url: req.originalUrl,
            method: req.method
        });
    }

    // 发送错误响应
    const response = {
        success: false,
        message,
        error: errorCode,
        timestamp: new Date().toISOString()
    };

    // 验证错误包含详细错误列表
    if (error.errors) {
        response.errors = error.errors;
    }

    // 开发环境返回堆栈信息
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
        response.details = {
            name: error.name,
            statusCode
        };
    }

    return res.status(statusCode).json(response);
};

/**
 * 404 处理中间件
 */
const notFoundHandler = (req, res, next) => {
    const error = createError.notFound(`路由 ${req.method} ${req.originalUrl} 不存在`);
    next(error);
};

/**
 * 异步错误包装器
 * 用于包装异步路由处理器，自动捕获错误
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 未处理 Promise 拒绝处理
 */
const setupUnhandledRejectionHandler = () => {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        // 在生产环境中，可以选择优雅关闭
        // process.exit(1);
    });

    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        // 在生产环境中，应该优雅关闭
        // process.exit(1);
    });
};

module.exports = {
    AppError,
    createError,
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    setupUnhandledRejectionHandler
};
