/**
 * JWT 认证中间件
 * 提供统一的身份验证和角色权限检查
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT Token
 * @param {Object} payload - 用户信息
 * @returns {string} JWT Token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object|null} 解码后的用户信息
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * 认证中间件 - 验证用户是否登录
 */
const authenticate = (req, res, next) => {
    try {
        // 从 Header 获取 Token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌',
                error: 'UNAUTHORIZED'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: '认证令牌无效或已过期',
                error: 'INVALID_TOKEN'
            });
        }

        // 将用户信息附加到请求对象
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '认证失败',
            error: error.message
        });
    }
};

/**
 * 角色授权中间件 - 验证用户角色
 * @param {...string} roles - 允许的角色列表
 * @returns {Function} 中间件函数
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证',
                error: 'UNAUTHORIZED'
            });
        }

        const userRole = req.user.role;

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `需要 ${roles.join(' 或 ')} 角色权限`,
                error: 'FORBIDDEN'
            });
        }

        next();
    };
};

/**
 * 可选认证中间件 - 如果有 Token 则验证，否则继续
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = decoded;
            }
        }

        next();
    } catch (error) {
        // 可选认证失败时继续执行
        next();
    }
};

/**
 * 检查资源所有权中间件
 * @param {string} resourceParam - 资源ID参数名
 * @returns {Function} 中间件函数
 */
const checkOwnership = (resourceParam) => {
    return (req, res, next) => {
        const resourceId = req.params[resourceParam];
        const userId = req.user?.id || req.user?._id;

        if (!userId || resourceId !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: '无权访问此资源',
                error: 'FORBIDDEN'
            });
        }

        next();
    };
};

/**
 * 学校资源访问检查 - 确保用户只能访问自己学校的资源
 */
const checkSchoolAccess = (req, res, next) => {
    const userSchool = req.user?.school;
    const resourceSchool = req.body?.school || req.params?.schoolId || req.query?.schoolId;

    // Admin 角色可以访问所有资源
    if (req.user?.role === 'Admin') {
        return next();
    }

    if (resourceSchool && userSchool && resourceSchool !== userSchool.toString()) {
        return res.status(403).json({
            success: false,
            message: '无权访问其他学校的资源',
            error: 'FORBIDDEN'
        });
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    authorize,
    optionalAuth,
    checkOwnership,
    checkSchoolAccess,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
