require('dotenv').config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const app = express();

// 路由
const Routes = require("./routes/route.js");
const chatbotRoutes = require('./routes/chatbot');
const feedbackRoutes = require('./routes/feedback');
const geminiRoutes = require('./routes/gemini');
const workflowRoutes = require('./routes/workflow');
const healthRoutes = require('./routes/healthRoutes');

// 中间件
const { globalErrorHandler, notFoundHandler, setupUnhandledRejectionHandler } = require('./middleware/errorHandler');
const { userFilterMiddleware } = require('./utils/userFilter');

// 设置未处理异常捕获
setupUnhandledRejectionHandler();

const PORT = process.env.PORT || 5000;

// 基础中间件
app.set('trust proxy', 1); // 信任反向代理（Nginx），使 rate-limit 能正确识别客户端IP
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// 静态文件服务（上传文件和视频）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// 用户数据过滤中间件（自动移除密码等敏感字段）
app.use(userFilterMiddleware);

// API 路由
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api', healthRoutes); // 健康检查和监控端点
app.use('/api', Routes);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(globalErrorHandler);

// MongoDB 连接配置
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // 连接池配置
    maxPoolSize: 10,           // 最大连接数
    minPoolSize: 2,            // 最小连接数
    connectTimeoutMS: 30000,   // 连接超时
    socketTimeoutMS: 45000,    // Socket 超时
    // 重试配置
    retryWrites: true,
    w: 'majority'
};

// 数据库连接
mongoose
    .connect(process.env.MONGO_URL, mongoOptions)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        console.log(`   Pool Size: ${mongoOptions.maxPoolSize}`);
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    });

// 优雅关闭
const gracefulShutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    mongoose.connection.close(false).then(() => {
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
