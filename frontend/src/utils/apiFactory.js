/**
 * Redux API Handle 工厂函数
 * 提供通用的 API 调用和错误处理逻辑
 */

import axios from 'axios';

// 基础 URL
const BASE_URL = process.env.REACT_APP_BASE_URL ?? 'http://localhost:5000';

/**
 * 创建 API 客户端（带请求/响应拦截器）
 */
const apiClient = axios.create({
    baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器 - 添加认证 Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // 认证错误
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

/**
 * 统一错误消息提取
 */
const extractErrorMessage = (error) => {
    return error.response?.data?.message || error.message || '网络错误，请稍后重试';
};

/**
 * 创建通用的 API Action 工厂
 * @param {Object} actions - Redux actions 对象
 * @param {Object} options - 配置选项
 * @returns {Object} - API action 函数集合
 */
export const createApiActions = (actions, options = {}) => {
    const {
        requestAction = actions.getRequest || actions.authRequest,
        successAction = actions.getSuccess || actions.doneSuccess || actions.authSuccess,
        failedAction = actions.getFailed || actions.authFailed,
        errorAction = actions.getError || actions.authError,
        resourceName = '资源',
    } = options;

    return {
        /**
         * GET 请求
         * @param {string} endpoint - API端点
         * @param {Object} config - Axios配置
         */
        get: (endpoint, config = {}) => async (dispatch) => {
            dispatch(requestAction());

            try {
                const result = await apiClient.get(endpoint, config);

                // 处理不同的响应格式
                if (result.data.message && !result.data.success) {
                    dispatch(failedAction(result.data.message));
                } else if (result.data.success === false) {
                    dispatch(failedAction(result.data.message || `获取${resourceName}失败`));
                } else {
                    dispatch(successAction(result.data));
                }

                return result.data;
            } catch (error) {
                console.error(`获取${resourceName}错误:`, error);
                dispatch(errorAction(extractErrorMessage(error)));
                throw error;
            }
        },

        /**
         * POST 请求
         * @param {string} endpoint - API端点
         * @param {Object} data - 请求数据
         * @param {Object} config - Axios配置
         */
        post: (endpoint, data = {}, config = {}) => async (dispatch) => {
            dispatch(requestAction());

            try {
                const result = await apiClient.post(endpoint, data, config);

                if (result.data.message && !result.data.success) {
                    dispatch(failedAction(result.data.message));
                } else {
                    dispatch(successAction(result.data));
                }

                return result.data;
            } catch (error) {
                console.error(`创建${resourceName}错误:`, error);
                dispatch(errorAction(extractErrorMessage(error)));
                throw error;
            }
        },

        /**
         * PUT 请求
         * @param {string} endpoint - API端点
         * @param {Object} data - 请求数据
         * @param {Object} config - Axios配置
         */
        put: (endpoint, data = {}, config = {}) => async (dispatch) => {
            dispatch(requestAction());

            try {
                const result = await apiClient.put(endpoint, data, config);

                if (result.data.message && !result.data.success) {
                    dispatch(failedAction(result.data.message));
                } else {
                    // 更新成功可能返回不同 action
                    if (actions.stuffDone) {
                        dispatch(actions.stuffDone());
                    } else {
                        dispatch(successAction(result.data));
                    }
                }

                return result.data;
            } catch (error) {
                console.error(`更新${resourceName}错误:`, error);
                dispatch(errorAction(extractErrorMessage(error)));
                throw error;
            }
        },

        /**
         * DELETE 请求
         * @param {string} endpoint - API端点
         * @param {Object} config - Axios配置
         */
        delete: (endpoint, config = {}) => async (dispatch) => {
            dispatch(requestAction());

            try {
                const result = await apiClient.delete(endpoint, config);

                if (result.data.message) {
                    dispatch(failedAction(result.data.message));
                } else if (actions.getDeleteSuccess) {
                    dispatch(actions.getDeleteSuccess());
                } else {
                    dispatch(actions.stuffDone || successAction(result.data));
                }

                return result.data;
            } catch (error) {
                console.error(`删除${resourceName}错误:`, error);
                dispatch(errorAction(extractErrorMessage(error)));
                throw error;
            }
        },
    };
};

/**
 * 创建简单的 CRUD Actions
 * @param {string} resourcePath - 资源路径
 * @param {Object} actions - Redux actions
 * @param {string} resourceName - 资源名称（用于日志）
 */
export const createCrudActions = (resourcePath, actions, resourceName) => {
    const api = createApiActions(actions, { resourceName });

    return {
        getAll: (id) => api.get(`/${resourcePath}/${id}`),
        getById: (id) => api.get(`/${resourcePath}/${id}`),
        create: (data) => api.post(`/${resourcePath}Create`, data),
        update: (id, data) => api.put(`/${resourcePath}/${id}`, data),
        delete: (id) => api.delete(`/${resourcePath}/${id}`),
    };
};

/**
 * 批量操作 Actions
 */
export const createBatchActions = (actions, resourceName) => {
    return {
        batchDelete: (ids, endpoint) => async (dispatch) => {
            dispatch(actions.getRequest());

            try {
                const result = await apiClient.post(endpoint, { ids });

                if (result.data.message) {
                    dispatch(actions.getFailed(result.data.message));
                } else {
                    dispatch(actions.stuffDone());
                }

                return result.data;
            } catch (error) {
                console.error(`批量删除${resourceName}错误:`, error);
                dispatch(actions.getError(extractErrorMessage(error)));
                throw error;
            }
        },
    };
};

export { apiClient, extractErrorMessage };