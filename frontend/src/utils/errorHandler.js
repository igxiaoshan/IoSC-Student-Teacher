/**
 * 错误处理工具函数
 * 用于统一处理各种类型的错误，确保返回可渲染的字符串
 */
import React from 'react';

/**
 * 将错误对象转换为可显示的字符串
 * @param {any} error - 错误对象或字符串
 * @returns {string} - 可显示的错误消息
 */
export const formatErrorMessage = (error) => {
    // 如果已经是字符串，直接返回
    if (typeof error === 'string') {
        return error;
    }

    // 如果是null或undefined
    if (!error) {
        return '未知错误';
    }

    // 如果是Error对象
    if (error instanceof Error) {
        return error.message || '系统错误';
    }

    // 如果是axios错误响应
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    // 如果有message属性
    if (error.message) {
        return error.message;
    }

    // 如果是对象，尝试序列化
    if (typeof error === 'object') {
        try {
            // 检查是否是React错误对象
            if (error.name && error.code && error.config) {
                return `网络请求失败: ${error.message || '请检查网络连接'}`;
            }
            
            // 其他对象类型
            return JSON.stringify(error);
        } catch (e) {
            return '错误信息格式异常';
        }
    }

    // 其他类型
    return String(error);
};

/**
 * 检查错误是否为网络错误
 * @param {any} error - 错误对象
 * @returns {boolean} - 是否为网络错误
 */
export const isNetworkError = (error) => {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('Network Error') ||
           error?.name === 'AxiosError';
};

/**
 * 检查错误是否为认证错误
 * @param {any} error - 错误对象
 * @returns {boolean} - 是否为认证错误
 */
export const isAuthError = (error) => {
    return error?.response?.status === 401 || 
           error?.response?.status === 403 ||
           error?.message?.includes('Unauthorized');
};

/**
 * 获取用户友好的错误消息
 * @param {any} error - 错误对象
 * @returns {string} - 用户友好的错误消息
 */
export const getUserFriendlyMessage = (error) => {
    if (isNetworkError(error)) {
        return '网络连接失败，请检查网络设置后重试';
    }

    if (isAuthError(error)) {
        return '登录已过期，请重新登录';
    }

    const message = formatErrorMessage(error);
    
    // 常见错误的友好提示
    const friendlyMessages = {
        '404': '请求的资源不存在',
        '500': '服务器内部错误，请稍后重试',
        '400': '请求参数错误',
        'timeout': '请求超时，请重试',
        'ECONNREFUSED': '无法连接到服务器',
    };

    for (const [key, friendlyMsg] of Object.entries(friendlyMessages)) {
        if (message.includes(key)) {
            return friendlyMsg;
        }
    }

    return message;
};

/**
 * Redux错误处理中间件辅助函数
 * @param {any} error - 错误对象
 * @returns {string} - 处理后的错误消息
 */
export const handleReduxError = (error) => {
    console.error('Redux Error:', error);
    return formatErrorMessage(error);
};

/**
 * 组件错误处理Hook
 * @returns {object} - 错误处理相关的方法和状态
 */
export const useErrorHandler = () => {
    const [error, setError] = React.useState(null);

    const handleError = React.useCallback((error) => {
        const formattedError = formatErrorMessage(error);
        setError(formattedError);
        console.error('Component Error:', error);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    return {
        error,
        handleError,
        clearError,
        hasError: !!error
    };
};

const errorHandlerUtils = {
    formatErrorMessage,
    isNetworkError,
    isAuthError,
    getUserFriendlyMessage,
    handleReduxError,
    useErrorHandler
};

export default errorHandlerUtils;
