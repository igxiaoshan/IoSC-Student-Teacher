import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 知识视频生成API
export const knowledgeVideoAPI = {
    // 生成知识视频
    generateVideo: (keyword, subject = null, userId = null, userType = null) => {
        const data = { keyword };
        if (subject) data.subject = subject;
        if (userId) data.userId = userId;
        if (userType) data.userType = userType;
        return apiClient.post('/api/knowledge/video-generate', data);
    },

    // 获取知识视频历史记录
    getHistory: (userId, limit = 20) =>
        apiClient.get(`/api/knowledge/video-history/${userId}`, { params: { limit } }),

    // 查询任务状态（复用jimengAPI）
    getTaskStatus: (taskId, type = 'video') =>
        apiClient.get(`/api/jimeng/task/${taskId}`, { params: { type } }),
};

export default knowledgeVideoAPI;