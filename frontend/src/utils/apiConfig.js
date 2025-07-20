import axios from 'axios';

// 获取基础URL
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

// 创建axios实例
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // 30秒超时
    headers: {
        'Content-Type': 'application/json',
    }
});

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        // 在发送请求之前做些什么
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        
        // 可以在这里添加认证token
        // const token = localStorage.getItem('token');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        // 对响应数据做点什么
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error);
        
        // 统一错误处理
        if (error.response) {
            // 服务器响应了错误状态码
            const { status, data } = error.response;
            console.error(`API Error ${status}:`, data);
            
            switch (status) {
                case 401:
                    // 未授权，可能需要重新登录
                    console.warn('未授权访问，请重新登录');
                    break;
                case 403:
                    // 禁止访问
                    console.warn('访问被禁止');
                    break;
                case 404:
                    // 资源未找到
                    console.warn('请求的资源不存在');
                    break;
                case 500:
                    // 服务器内部错误
                    console.error('服务器内部错误');
                    break;
                default:
                    console.error(`请求失败: ${status}`);
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            console.error('网络错误，请检查网络连接');
        } else {
            // 其他错误
            console.error('请求配置错误:', error.message);
        }
        
        return Promise.reject(error);
    }
);

// 导出配置好的axios实例
export default apiClient;

// 导出基础URL供其他地方使用
export { BASE_URL };

// 常用API方法封装
export const api = {
    get: (url, config) => apiClient.get(url, config),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),
    patch: (url, data, config) => apiClient.patch(url, data, config),
};

// AI相关API封装
export const aiAPI = {
    // 通用方法
    get: (url, config) => api.get(url, config),
    post: (url, data, config) => api.post(url, data, config),
    put: (url, data, config) => api.put(url, data, config),
    delete: (url, config) => api.delete(url, config),

    // 课件生成
    generateCourseware: (data) => api.post('/ai/courseware/generate', data),
    getTeacherCourseware: (teacherId) => api.get(`/ai/courseware/teacher/${teacherId}`),
    getTeacherCoursewareHistory: (teacherId) => api.get(`/ai/courseware/teacher/${teacherId}/history`),
    updateCourseware: (id, data) => api.put(`/ai/courseware/${id}`, data),
    deleteCourseware: (id) => api.delete(`/ai/courseware/${id}`),

    // 考核生成 - 增加超时时间
    generateAssessment: (data) => api.post('/ai/assessment/generate', data, { timeout: 60000 }),
    getTeacherAssessments: (teacherId) => api.get(`/ai/assessment/teacher/${teacherId}`),
    getTeacherAssessmentHistory: (teacherId) => api.get(`/ai/assessment/teacher/${teacherId}/history`),
    updateAssessment: (id, data) => api.put(`/ai/assessment/${id}`, data),
    deleteAssessment: (id) => api.delete(`/ai/assessment/${id}`),

    // 实训练习生成 - 增加超时时间
    generatePracticalExercise: (teacherId, data) => api.post(`/ai/practical-exercise/generate/${teacherId}`, data, { timeout: 60000 }),
    getTeacherPracticalExercises: (teacherId) => api.get(`/ai/practical-exercise/teacher/${teacherId}`),
    getPracticalExerciseById: (exerciseId) => api.get(`/ai/practical-exercise/${exerciseId}`),
    updatePracticalExercise: (exerciseId, data) => api.put(`/ai/practical-exercise/${exerciseId}`, data),
    deletePracticalExercise: (exerciseId) => api.delete(`/ai/practical-exercise/${exerciseId}`),
    exportPracticalExerciseToWord: (exercise) => api.post('/ai/practical-exercise/export/word', { exercise }, { responseType: 'blob' }),
    publishPracticalExercise: (exerciseId) => api.put(`/ai/practical-exercise/${exerciseId}/publish`),
    sharePracticalExercise: (exerciseId, data) => api.post(`/ai/practical-exercise/${exerciseId}/share`, data),



    // 学情分析
    analyzeSubmission: (submissionId, data) => api.post(`/ai/analysis/submission/${submissionId}`, data),
    getClassAnalysisReport: (teacherId, subjectId, assessmentId) =>
        api.get(`/ai/analysis/class/${teacherId}/${subjectId}/${assessmentId}`),

    // 学生AI助手
    askLearningAssistant: (data) => api.post('/student/ai/ask', data),
    generatePracticeQuestions: (data) => api.post('/student/ai/practice/generate', data),
    submitPracticeAnswer: (data) => api.post('/student/ai/practice/submit', data),
};
