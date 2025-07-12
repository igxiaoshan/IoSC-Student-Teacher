/**
 * 简化版服务器 - 专门用于测试AI功能
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

console.log('🚀 启动简化版AI测试服务器...');

// 健康检查
app.get('/api/ai/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'AI服务基础路由正常',
        timestamp: new Date().toISOString(),
        env: {
            DIFY_BASE_URL: process.env.DIFY_BASE_URL,
            DIFY_API_KEY_1: process.env.DIFY_API_KEY_1 ? '已配置' : '未配置'
        }
    });
});

// 学生问答API
app.post('/api/ai/student/ask-question', async (req, res) => {
    console.log('📝 收到学生问答请求:', req.body);
    
    const { question, studentId, subject } = req.body;
    
    if (!question || !studentId) {
        return res.status(400).json({
            success: false,
            error: '问题内容和学生ID不能为空'
        });
    }

    try {
        // 模拟AI回复（实际环境中会调用Dify服务）
        const mockResponse = {
            success: true,
            data: {
                answer: `您好！我收到了您关于"${subject || '通用'}"学科的问题："${question}"。\n\n这是一个模拟回复。要获得真正的AI回复，请确保：\n1. Dify服务正在运行\n2. Ollama DeepSeek-R1模型已加载\n3. API密钥配置正确\n\n当前时间：${new Date().toLocaleString('zh-CN')}`,
                conversationId: 'mock-conversation-' + Date.now(),
                recordId: 'mock-record-' + Date.now()
            }
        };
        
        console.log('✅ 返回模拟AI回复');
        res.json(mockResponse);
        
    } catch (error) {
        console.error('❌ 处理请求时出错:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
            message: error.message
        });
    }
});

// 练习生成API
app.post('/api/ai/student/generate-exercise', (req, res) => {
    console.log('📝 收到练习生成请求:', req.body);
    
    res.json({
        success: true,
        data: {
            exercises: '# 模拟练习题\n\n## 题目1\n这是一道模拟的练习题。\n\n**答案**: 这是模拟答案。\n\n**解析**: 这是模拟解析。'
        }
    });
});

// 答案检查API
app.post('/api/ai/student/check-answer', (req, res) => {
    console.log('📝 收到答案检查请求:', req.body);
    
    res.json({
        success: true,
        data: {
            feedback: '这是模拟的答案检查反馈。',
            isCorrect: Math.random() > 0.5,
            conversationId: 'mock-conversation-' + Date.now()
        }
    });
});

// 教师备课API
app.post('/api/ai/teacher/generate-lesson-plan', (req, res) => {
    console.log('📝 收到备课生成请求:', req.body);
    
    res.json({
        success: true,
        data: {
            lessonPlan: '# 模拟备课方案\n\n## 教学目标\n这是一个模拟的备课方案。\n\n## 教学内容\n1. 知识点1\n2. 知识点2\n\n## 教学方法\n讲解、练习、讨论'
        }
    });
});

// 考核生成API
app.post('/api/ai/teacher/generate-exam', (req, res) => {
    console.log('📝 收到考核生成请求:', req.body);
    
    res.json({
        success: true,
        data: {
            examContent: '# 模拟考核试卷\n\n## 一、选择题\n1. 这是一道模拟选择题？\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n\n答案：A'
        }
    });
});

// 学情分析API
app.post('/api/ai/teacher/analyze-performance', (req, res) => {
    console.log('📝 收到学情分析请求:', req.body);
    
    res.json({
        success: true,
        data: {
            analysis: '# 模拟学情分析报告\n\n## 整体表现\n学生整体表现良好。\n\n## 建议\n1. 加强基础练习\n2. 提高应用能力'
        }
    });
});

// 错误处理
app.use((error, req, res, next) => {
    console.error('❌ 服务器错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: error.message
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`✅ 简化版AI测试服务器启动成功!`);
    console.log(`📍 服务器地址: http://localhost:${PORT}`);
    console.log(`🤖 AI健康检查: http://localhost:${PORT}/api/ai/health`);
    console.log(`🧪 测试命令: curl -X POST http://localhost:${PORT}/api/ai/student/ask-question -H "Content-Type: application/json" -d '{"question":"测试问题","studentId":"test123","subject":"数学"}'`);
    console.log('🎯 现在可以测试前端学习助手页面了！');
});
