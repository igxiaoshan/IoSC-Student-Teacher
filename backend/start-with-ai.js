/**
 * 带AI功能的服务器启动脚本
 * 包含完整的错误处理和调试信息
 */

// 首先加载环境变量
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

console.log('🚀 启动AI智能学校管理系统...');
console.log('📊 环境变量检查:');
console.log('- DIFY_BASE_URL:', process.env.DIFY_BASE_URL || '未配置');
console.log('- DIFY_API_KEY_1:', process.env.DIFY_API_KEY_1 ? '已配置' : '未配置');
console.log('- MONGO_URL:', process.env.MONGO_URL || '未配置');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件配置
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 基础路由
const Routes = require("./routes/route.js");
app.use('/', Routes);

// 尝试加载AI路由
try {
    console.log('🤖 加载AI功能路由...');
    const aiRoutes = require('./routes/aiRoutes');
    app.use('/api/ai', aiRoutes);
    console.log('✅ AI路由加载成功');
} catch (error) {
    console.error('❌ AI路由加载失败:', error.message);
    console.log('🔧 创建临时AI路由...');
    
    // 创建临时AI路由
    const tempAIRouter = express.Router();
    
    tempAIRouter.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            message: 'AI服务基础路由正常（临时版本）',
            timestamp: new Date().toISOString()
        });
    });
    
    tempAIRouter.post('/student/ask-question', (req, res) => {
        console.log('收到AI问答请求:', req.body);
        res.json({
            success: true,
            data: {
                answer: '抱歉，AI服务暂时不可用。请检查Dify服务是否正在运行，或联系管理员。',
                conversationId: 'temp-conversation-' + Date.now(),
                recordId: 'temp-record-' + Date.now()
            }
        });
    });
    
    app.use('/api/ai', tempAIRouter);
    console.log('⚠️  临时AI路由已创建');
}

// 其他路由
try {
    const feedbackRoutes = require('./routes/feedback');
    app.use('/api/feedback', feedbackRoutes);
    console.log('✅ 反馈路由加载成功');
} catch (error) {
    console.error('❌ 反馈路由加载失败:', error.message);
}

try {
    const chatbotRoutes = require('./routes/chatbot');
    app.use('/api/chat', chatbotRoutes);
    console.log('✅ 聊天机器人路由加载成功');
} catch (error) {
    console.error('❌ 聊天机器人路由加载失败:', error.message);
}

// 数据库连接
const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1/school";
        console.log('🔗 连接数据库:', mongoUrl);
        
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ 数据库连接成功');
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.log('⚠️  服务器将在没有数据库的情况下启动');
    }
};

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: error.message
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '路由不存在',
        path: req.originalUrl
    });
});

// 启动服务器
const startServer = async () => {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log('🎉 服务器启动成功!');
        console.log(`📍 服务器地址: http://localhost:${PORT}`);
        console.log(`🤖 AI健康检查: http://localhost:${PORT}/api/ai/health`);
        console.log(`🧪 测试AI问答: curl -X POST http://localhost:${PORT}/api/ai/student/ask-question -H "Content-Type: application/json" -d '{"question":"测试","studentId":"test","subject":"数学"}'`);
        console.log('📝 查看日志以获取更多信息');
    });
};

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 收到关闭信号，正在优雅关闭服务器...');
    mongoose.connection.close(() => {
        console.log('✅ 数据库连接已关闭');
        process.exit(0);
    });
});

startServer().catch(error => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
});
