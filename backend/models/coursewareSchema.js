const mongoose = require("mongoose");

// 课件资源模型
const coursewareSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    // 课程大纲
    syllabus: {
        type: String,
        required: true,
    },
    // 上传的文档资源
    uploadedDocuments: [{
        fileName: String,
        originalName: String,
        filePath: String,
        fileType: String, // pdf, docx, txt, etc.
        fileSize: Number,
        uploadDate: { type: Date, default: Date.now },
        extractedContent: String, // 提取的文本内容
        isProcessed: { type: Boolean, default: false }
    }],
    // 知识点列表
    knowledgePoints: [{
        title: String,
        content: String,
        difficulty: {
            type: String,
            enum: ['初级', '中级', '高级'],
            default: '中级'
        },
        estimatedTime: Number, // 预计学习时间（分钟）
    }],
    // 教学内容
    teachingContent: {
        // 知识讲解
        lectures: [{
            title: String,
            content: String,
            duration: Number, // 时长（分钟）
            resources: [String], // 资源链接
        }],
        // 实训练习
        practicalExercises: [{
            title: String,
            description: String,
            instructions: String,
            difficulty: {
                type: String,
                enum: ['初级', '中级', '高级'],
                default: '中级'
            },
            estimatedTime: Number,
            resources: [String],
        }],
        // 时间分布
        timeDistribution: {
            lectureTime: Number, // 讲解时间
            practiceTime: Number, // 练习时间
            discussionTime: Number, // 讨论时间
            assessmentTime: Number, // 评估时间
        }
    },
    // AI生成标记
    isAIGenerated: {
        type: Boolean,
        default: false,
    },
    // 生成参数
    generationParams: {
        courseLevel: String,
        studentCount: Number,
        duration: Number, // 课程总时长
        focusAreas: [String], // 重点领域
    },
    // 使用统计
    usageStats: {
        viewCount: { type: Number, default: 0 },
        downloadCount: { type: Number, default: 0 },
        lastUsed: Date,
    },
    status: {
        type: String,
        enum: ['草稿', '已发布', '已归档'],
        default: '草稿'
    },
    // 下载和导出功能
    exportFormats: [{
        format: String, // pdf, docx, pptx
        filePath: String,
        generatedAt: Date
    }],
    // 手动调整记录
    manualAdjustments: [{
        section: String, // 调整的部分
        originalContent: String,
        adjustedContent: String,
        adjustedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'teacher'
        },
        adjustedAt: { type: Date, default: Date.now },
        reason: String
    }]
}, { timestamps: true });

module.exports = mongoose.model("courseware", coursewareSchema);
