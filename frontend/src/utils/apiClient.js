/**
 * 统一 Axios API 客户端
 * 包含请求/响应拦截器、错误处理、Token 自动刷新
 */

import axios from 'axios';

// 基础配置
const BASE_URL = process.env.REACT_APP_BASE_URL ?? 'http://localhost:5000';
const TIMEOUT = 30000;

// 创建 Axios 实例
const apiClient = axios.create({
    baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// 请求拦截器
// ============================================

apiClient.interceptors.request.use(
    (config) => {
        // 添加 Token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加用户信息
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                config.headers['X-User-Id'] = user._id || user.id;
                config.headers['X-User-Role'] = user.role;
            } catch (e) {
                // 忽略解析错误
            }
        }

        // 请求日志（开发环境）
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
        }

        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// ============================================
// 响应拦截器
// ============================================

apiClient.interceptors.response.use(
    (response) => {
        // 响应日志（开发环境）
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Response] ${response.config.url}`, response.data);
        }

        // 处理新的 API 响应格式
        if (response.data && typeof response.data.success === 'boolean') {
            if (!response.data.success) {
                // API 返回 success: false，视为业务错误
                return Promise.reject(new Error(response.data.message || '请求失败'));
            }
        }

        return response;
    },
    (error) => {
        // 错误处理
        const { response, config } = error;

        if (response) {
            const { status, data } = response;

            switch (status) {
                case 401:
                    // 未授权 - 清除本地存储并跳转登录
                    console.warn('[API] Unauthorized - Redirecting to login');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');

                    // 不在登录页面时才跳转
                    if (!window.location.pathname.includes('Login')) {
                        window.location.href = '/';
                    }
                    break;

                case 403:
                    // 禁止访问
                    console.warn('[API] Forbidden - Access denied');
                    break;

                case 404:
                    // 资源不存在
                    console.warn('[API] Not Found:', config?.url);
                    break;

                case 422:
                    // 验证错误
                    console.warn('[API] Validation Error:', data?.errors);
                    break;

                case 500:
                    // 服务器错误
                    console.error('[API] Server Error:', data?.message);
                    break;

                default:
                    console.error('[API] Error:', status, data);
            }

            // 返回统一格式的错误
            error.message = data?.message || error.message || `请求失败 (${status})`;
            error.errors = data?.errors;
        } else if (error.request) {
            // 请求已发出但没有响应
            console.error('[API] No response received');
            error.message = '网络错误，请检查网络连接';
        } else {
            // 请求配置错误
            console.error('[API] Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

// ============================================
// API 方法封装
// ============================================

const api = {
    /**
     * GET 请求
     * @param {string} url - 请求路径
     * @param {Object} params - 查询参数
     * @param {Object} config - 额外配置
     */
    get: async (url, params = {}, config = {}) => {
        const response = await apiClient.get(url, { params, ...config });
        return response.data;
    },

    /**
     * POST 请求
     * @param {string} url - 请求路径
     * @param {Object} data - 请求数据
     * @param {Object} config - 额外配置
     */
    post: async (url, data = {}, config = {}) => {
        const response = await apiClient.post(url, data, config);
        return response.data;
    },

    /**
     * PUT 请求
     * @param {string} url - 请求路径
     * @param {Object} data - 请求数据
     * @param {Object} config - 额外配置
     */
    put: async (url, data = {}, config = {}) => {
        const response = await apiClient.put(url, data, config);
        return response.data;
    },

    /**
     * PATCH 请求
     * @param {string} url - 请求路径
     * @param {Object} data - 请求数据
     * @param {Object} config - 额外配置
     */
    patch: async (url, data = {}, config = {}) => {
        const response = await apiClient.patch(url, data, config);
        return response.data;
    },

    /**
     * DELETE 请求
     * @param {string} url - 请求路径
     * @param {Object} config - 额外配置
     */
    delete: async (url, config = {}) => {
        const response = await apiClient.delete(url, config);
        return response.data;
    },

    /**
     * 上传文件
     * @param {string} url - 请求路径
     * @param {File} file - 文件对象
     * @param {Object} data - 额外数据
     * @param {Function} onProgress - 进度回调
     */
    upload: async (url, file, data = {}, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const response = await apiClient.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data;
    },

    /**
     * 下载文件
     * @param {string} url - 请求路径
     * @param {string} filename - 文件名
     */
    download: async (url, filename) => {
        const response = await apiClient.get(url, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    },
};

// ============================================
// API 模块封装
// ============================================

// 用户相关 API
export const userAPI = {
    login: (role, credentials) => api.post(`/${role}Login`, credentials),
    register: (role, data) => api.post(`/${role}Reg`, data),
    getProfile: (id, role) => api.get(`/${role}/${id}`),
    updateProfile: (id, role, data) => api.put(`/${role}/${id}`, data),
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },
};

// 学生相关 API
export const studentAPI = {
    getAll: (schoolId) => api.get(`/Students/${schoolId}`),
    getById: (id) => api.get(`/Student/${id}`),
    create: (data) => api.post('/StudentReg', data),
    update: (id, data) => api.put(`/Student/${id}`, data),
    delete: (id) => api.delete(`/Student/${id}`),
    // 科目相关
    getSubjects: (studentId) => api.get(`/student/${studentId}/subjects`),
    getAvailableSubjects: (studentId) => api.get(`/student/${studentId}/subjects/available`),
    selectSubject: (studentId, subjectId, data) => api.post(`/student/${studentId}/subjects/select`, { subjectId, ...data }),
    unselectSubject: (studentId, subjectId) => api.delete(`/student/${studentId}/subjects/${subjectId}`),
    autoAssignSubjects: (studentId) => api.post(`/student/${studentId}/subjects/auto-assign`),
    updateSubjectPreferences: (studentId, subjectId, data) => api.put(`/student/${studentId}/subjects/${subjectId}/preferences`, data),
    // 科目学习记录
    getSubjectTimeline: (studentId, subjectId) => api.get(`/student/${studentId}/subjects/${subjectId}/timeline`),
    // 学生仪表板
    getDashboard: (studentId, params) => api.get(`/student-dashboard/${studentId}`, params),
    getLearningGoals: (studentId) => api.get(`/student-dashboard/${studentId}/goals`),
    getSuggestions: (studentId, params) => api.get(`/student-dashboard/${studentId}/suggestions`, params),
    getStatistics: (studentId, params) => api.get(`/student-dashboard/${studentId}/statistics`, params),
    getReport: (studentId, params) => api.get(`/student-dashboard/${studentId}/report`, params),
    // 日历相关
    getCalendar: (studentId, params) => api.get(`/student/${studentId}/calendar`, params),
    getCalendarStatistics: (studentId) => api.get(`/student/${studentId}/calendar/statistics`),
    syncCalendarCourses: (studentId) => api.post(`/student/${studentId}/calendar/sync/courses`),
    syncCalendarExams: (studentId) => api.post(`/student/${studentId}/calendar/sync/exams`),
    generateAIStudyPlan: (studentId, data) => api.post(`/student/${studentId}/calendar/ai/study-plan`, data),
    addCalendarEvent: (studentId, data) => api.post(`/student/${studentId}/calendar/events`, data),
    updateEventStatus: (studentId, eventId, data) => api.put(`/student/${studentId}/calendar/events/${eventId}/status`, data),
    // 考勤趋势
    getAttendanceTrend: (studentId, viewType) => api.get(`/student/${studentId}/attendance/trend`, { viewType }),
    // 考勤预警 (学生维度)
    getAttendanceAlerts: (studentId, params) => api.get(`/StudentAttendanceAlerts/${studentId}`, params),
    getSubjectAbsence: (studentId, params) => api.get(`/StudentSubjectAbsence/${studentId}`, params),
    // 学习路径
    getLearningPath: (studentId) => api.get(`/learning-path/student/${studentId}`),
    createLearningPath: (studentId, data) => api.post(`/learning-path/${studentId}/generate`, data),
    updateLearningPath: (studentId, data) => api.put(`/learning-path/${studentId}/update`, data),
    updatePhaseProgress: (studentId, phaseIndex, data) => api.put(`/learning-path/${studentId}/phases/${phaseIndex}`, data),
};

// 教师相关 API
export const teacherAPI = {
    getAll: (schoolId, params) => api.get(`/Teachers/${schoolId}`, params),
    getById: (id) => api.get(`/Teacher/${id}`),
    create: (data) => api.post('/TeacherReg', data),
    update: (id, data) => api.put(`/Teacher/${id}`, data),
    delete: (id) => api.delete(`/Teacher/${id}`),
};

// 班级相关 API
export const classAPI = {
    getAll: (schoolId) => api.get(`/SclassList/${schoolId}`),
    getById: (id) => api.get(`/Sclass/${id}`),
    create: (data) => api.post('/SclassCreate', data),
    update: (id, data) => api.put(`/Sclass/${id}`, data),
    delete: (id) => api.delete(`/Sclass/${id}`),
    getStudents: (id) => api.get(`/Sclass/Students/${id}`),
};

// AI 相关 API
export const aiAPI = {
    generateCourseware: (data) => api.post('/ai/courseware/generate', data),
    getCoursewareList: (teacherId) => api.get(`/ai/courseware/teacher/${teacherId}`),
    generateAssessment: (data) => api.post('/ai/assessment/generate', data),
    getAssessmentList: (teacherId) => api.get(`/ai/assessment/teacher/${teacherId}`),
    askQuestion: (data) => api.post('/student/ai/ask', data),
    generatePractice: (data) => api.post('/student/ai/practice/generate', data),
};

// 导出
export { apiClient };
export default api;