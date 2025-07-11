require('dotenv').config();

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs")

const app = express()

// Import routes
const Routes = require("./routes/route.js")
const chatbotRoutes = require('./routes/chatbot');
const feedbackRoutes = require('./routes/feedback');
const streamingAIRoutes = require('./routes/streamingAI');
const teacherAIRoutes = require('./routes/teacherAI');

// Import AI middleware
const { aiErrorHandler } = require('./middleware/aiMiddleware');

const PORT = process.env.PORT || 5000

// 创建上传目录
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 中间件配置
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// mongoose
//     .connect(process.env.MONGO_URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(console.log("Connected to MongoDB"))
//     .catch((err) => console.log("NOT CONNECTED TO NETWORK", err))

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.log("❌ NOT CONNECTED TO NETWORK", err));


// 路由配置
app.use('/', Routes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/stream', streamingAIRoutes);
app.use('/api/teacher-ai', teacherAIRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});

// AI错误处理中间件
app.use(aiErrorHandler);

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            message: '文件太大',
            error: 'File size exceeds limit'
        });
    }

    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
