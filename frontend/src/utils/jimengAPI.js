import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 120000, // 视频生成需要更长时间
    headers: {
        'Content-Type': 'application/json',
    }
});

// 即梦AI API封装
export const jimengAPI = {
    // 文生图
    textToImage: (prompt, options = {}, userId = null, userType = null) => {
        const data = { prompt, options };
        if (userId) data.userId = userId;
        if (userType) data.userType = userType;
        return apiClient.post('/api/jimeng/text-to-image', data);
    },

    // 文生视频
    textToVideo: (prompt, options = {}, userId = null, userType = null) => {
        const data = { prompt, options };
        if (userId) data.userId = userId;
        if (userType) data.userType = userType;
        return apiClient.post('/api/jimeng/text-to-video', data);
    },

    // 查询任务状态
    getTaskStatus: (taskId, type = 'image') =>
        apiClient.get(`/api/jimeng/task/${taskId}`, { params: { type } }),

    // 获取模型列表
    getModels: () =>
        apiClient.get('/api/jimeng/models'),

    // 获取用户历史记录
    getUserHistory: (userId, type = null) =>
        apiClient.get(`/api/jimeng/history/${userId}`, { params: { type } }),

    // 获取服务状态
    getStatus: () =>
        apiClient.get('/api/jimeng/status'),
};

export default jimengAPI;
