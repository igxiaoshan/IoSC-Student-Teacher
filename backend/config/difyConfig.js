/**
 * Dify AI平台配置
 * 集成本地知识库模型
 */

const difyConfig = {
    // Dify API基础配置
    baseURL: process.env.DIFY_BASE_URL || 'http://localhost',
    apiKey: process.env.DIFY_API_KEY || 'your_dify_api_key',
    
    // 应用配置
    apps: {
        // 教师端应用
        teacher: {
            // 智能备课助手
            lessonPlanning: {
                appId: process.env.DIFY_TEACHER_LESSON_APP_ID || 'gbTFYyuYvH6RsNGa',
                endpoint: '/v1/chat-messages',
                mode: 'chat',
                description: '基于课程大纲和知识库自动设计教学内容'
            },
            // 考核内容生成
            examGeneration: {
                appId: process.env.DIFY_TEACHER_EXAM_APP_ID || 'gbTFYyuYvH6RsNGa',
                endpoint: '/v1/chat-messages',
                mode: 'chat',
                description: '根据教学内容自动生成考核题目和答案'
            },
            // 学情分析
            analyticsAssistant: {
                appId: process.env.DIFY_TEACHER_ANALYTICS_APP_ID || 'gbTFYyuYvH6RsNGa',
                endpoint: '/v1/chat-messages',
                mode: 'chat',
                description: '分析学生答案并提供教学建议'
            }
        },
        
        // 学生端应用
        student: {
            // 学习助手
            learningAssistant: {
                appId: process.env.DIFY_STUDENT_LEARNING_APP_ID || 'gbTFYyuYvH6RsNGa',
                endpoint: '/v1/chat-messages',
                mode: 'chat',
                description: '结合教学内容解答学生问题'
            },
            // 练习评测助手
            practiceAssistant: {
                appId: process.env.DIFY_STUDENT_PRACTICE_APP_ID || 'gbTFYyuYvH6RsNGa',
                endpoint: '/v1/chat-messages',
                mode: 'chat',
                description: '生成个性化练习题目并提供纠错'
            }
        }
    },
    
    // 请求配置
    requestConfig: {
        timeout: 60000, // 增加到60秒
        retries: 3,
        retryDelay: 1000
    },
    
    // 响应模式
    responseMode: {
        streaming: 'streaming',
        blocking: 'blocking'
    }
};

module.exports = difyConfig;
