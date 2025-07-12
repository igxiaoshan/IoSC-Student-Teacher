/**
 * 测试服务器启动脚本
 * 用于验证AI功能是否正常工作
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/test', (req, res) => {
    res.json({ 
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        env: {
            DIFY_BASE_URL: process.env.DIFY_BASE_URL,
            DIFY_API_KEY_1: process.env.DIFY_API_KEY_1 ? '已配置' : '未配置',
            DIFY_API_KEY_2: process.env.DIFY_API_KEY_2 ? '已配置' : '未配置'
        }
    });
});

// AI健康检查路由
app.get('/api/ai/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'AI服务基础路由正常',
        timestamp: new Date().toISOString()
    });
});

// 简单的AI测试路由
app.post('/api/ai/student/ask-question', (req, res) => {
    console.log('收到AI问答请求:', req.body);
    
    // 模拟AI回复
    res.json({
        success: true,
        data: {
            answer: '这是一个测试回复。AI服务正在开发中，请确保Dify服务正在运行。',
            conversationId: 'test-conversation-' + Date.now(),
            recordId: 'test-record-' + Date.now()
        }
    });
});

app.listen(PORT, () => {
    console.log(`测试服务器运行在端口 ${PORT}`);
    console.log(`访问 http://localhost:${PORT}/test 查看服务器状态`);
    console.log(`访问 http://localhost:${PORT}/api/ai/health 查看AI服务状态`);
});
