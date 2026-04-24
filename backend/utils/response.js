/**
 * 统一 API 响应格式工具
 * 确保所有 API 返回一致的响应结构
 */

/**
 * 成功响应
 * @param {Object} res - Express response 对象
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @param {number} statusCode - HTTP 状态码
 */
const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

/**
 * 错误响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 * @param {string} errorCode - 错误代码
 * @param {number} statusCode - HTTP 状态码
 * @param {*} errors - 详细错误信息（验证错误等）
 */
const errorResponse = (res, message = '操作失败', errorCode = 'ERROR', statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message,
        error: errorCode,
        timestamp: new Date().toISOString()
    };

    if (errors) {
        response.errors = errors;
    }

    // 开发环境下返回堆栈信息
    if (process.env.NODE_ENV === 'development' && errors?.stack) {
        response.stack = errors.stack;
    }

    return res.status(statusCode).json(response);
};

/**
 * 分页响应
 * @param {Object} res - Express response 对象
 * @param {Array} data - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {string} message - 成功消息
 */
const paginatedResponse = (res, data, pagination, message = '获取成功') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || data.length,
            totalPages: Math.ceil((pagination.total || data.length) / (pagination.limit || 10))
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * 创建响应
 * @param {Object} res - Express response 对象
 * @param {*} data - 创建的数据
 * @param {string} message - 成功消息
 */
const createdResponse = (res, data, message = '创建成功') => {
    return successResponse(res, data, message, 201);
};

/**
 * 无内容响应（删除成功等）
 * @param {Object} res - Express response 对象
 * @param {string} message - 成功消息
 */
const noContentResponse = (res, message = '操作成功') => {
    return res.status(204).json({
        success: true,
        message
    });
};

/**
 * 未找到响应
 * @param {Object} res - Express response 对象
 * @param {string} resource - 资源名称
 */
const notFoundResponse = (res, resource = '资源') => {
    return errorResponse(res, `${resource}不存在`, 'NOT_FOUND', 404);
};

/**
 * 未授权响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 */
const unauthorizedResponse = (res, message = '未授权访问') => {
    return errorResponse(res, message, 'UNAUTHORIZED', 401);
};

/**
 * 禁止访问响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 */
const forbiddenResponse = (res, message = '禁止访问') => {
    return errorResponse(res, message, 'FORBIDDEN', 403);
};

/**
 * 验证错误响应
 * @param {Object} res - Express response 对象
 * @param {Array|Object} errors - 验证错误
 */
const validationErrorResponse = (res, errors) => {
    return errorResponse(res, '数据验证失败', 'VALIDATION_ERROR', 422, errors);
};

/**
 * 服务器错误响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 * @param {Error} error - 错误对象
 */
const serverErrorResponse = (res, message = '服务器内部错误', error = null) => {
    console.error('Server Error:', error);
    return errorResponse(res, message, 'INTERNAL_ERROR', 500, error);
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    createdResponse,
    noContentResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    validationErrorResponse,
    serverErrorResponse
};
