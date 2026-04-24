/**
 * Winston 日志系统
 * 提供结构化日志、日志分级、文件输出、格式化
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 日志目录
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志级别
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// 日志颜色
const LOG_COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(LOG_COLORS);

// 自定义格式
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let log = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

        // 添加元数据
        if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }

        // 添加堆栈信息（错误级别）
        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }
        return log;
    })
);

// 创建 Logger 实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: LOG_LEVELS,
    format: customFormat,
    transports: [
        // 错误日志文件
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 所有日志文件
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    // 未捕获异常处理
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'exceptions.log'),
        }),
    ],
    // 未处理 Promise 拒绝
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'rejections.log'),
        }),
    ],
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

// HTTP 请求日志中间件
const httpLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

        if (res.statusCode >= 400) {
            logger.http(message, {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
        } else {
            logger.http(message);
        }
    });

    next();
};

// 便捷方法
const log = {
    error: (message, meta = {}) => logger.error(message, meta),
    warn: (message, meta = {}) => logger.warn(message, meta),
    info: (message, meta = {}) => logger.info(message, meta),
    http: (message, meta = {}) => logger.http(message, meta),
    debug: (message, meta = {}) => logger.debug(message, meta),

    // AI 相关日志
    ai: {
        request: (endpoint, params) => logger.info(`[AI Request] ${endpoint}`, { type: 'ai_request', endpoint, params }),
        response: (endpoint, duration, success = true) => logger.info(`[AI Response] ${endpoint} - ${duration}ms`, { type: 'ai_response', endpoint, duration, success }),
        error: (endpoint, error) => logger.error(`[AI Error] ${endpoint}`, { type: 'ai_error', endpoint, error: error.message }),
        cache: (key, hit) => logger.debug(`[AI Cache] ${hit ? 'HIT' : 'MISS'}: ${key}`, { type: 'ai_cache', key, hit }),
    },

    // 数据库相关日志
    db: {
        query: (collection, operation, duration) => logger.debug(`[DB] ${collection}.${operation} - ${duration}ms`, { type: 'db_query', collection, operation, duration }),
        error: (collection, operation, error) => logger.error(`[DB Error] ${collection}.${operation}`, { type: 'db_error', collection, operation, error: error.message }),
    },

    // 用户操作日志
    user: {
        login: (userId, role, ip) => logger.info(`[User] Login: ${userId} (${role})`, { type: 'user_login', userId, role, ip }),
        logout: (userId) => logger.info(`[User] Logout: ${userId}`, { type: 'user_logout', userId }),
        action: (userId, action, details) => logger.info(`[User] ${action}`, { type: 'user_action', userId, action, details }),
    },
};

// 日志统计
const getLogStats = () => {
    const stats = {
        logDir: LOG_DIR,
        files: [],
    };

    try {
        const files = fs.readdirSync(LOG_DIR);
        files.forEach(file => {
            const filePath = path.join(LOG_DIR, file);
            const stat = fs.statSync(filePath);
            stats.files.push({
                name: file,
                size: stat.size,
                modified: stat.mtime,
            });
        });
    } catch (error) {
        stats.error = error.message;
    }

    return stats;
};

module.exports = {
    logger,
    log,
    httpLogger,
    getLogStats,
};