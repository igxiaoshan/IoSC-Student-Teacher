const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blank'],
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    sclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    points: {
        type: Number,
        default: 1,
    },
    // 选择题选项
    options: [{
        text: String,
        isCorrect: Boolean,
        explanation: String
    }],
    // 正确答案（用于非选择题）
    correctAnswer: {
        type: String,
    },
    // 编程题相关
    codingDetails: {
        language: String,
        starterCode: String,
        testCases: [{
            input: String,
            expectedOutput: String,
            isHidden: Boolean
        }],
        timeLimit: Number, // in seconds
        memoryLimit: Number // in MB
    },
    // 知识点标签
    knowledgePoints: [{
        type: String,
    }],
    // AI生成相关
    aiGenerated: {
        type: Boolean,
        default: false,
    },
    aiPrompt: {
        type: String,
    },
    // 使用统计
    usageCount: {
        type: Number,
        default: 0,
    },
    averageScore: {
        type: Number,
        default: 0,
    },
    // 状态
    isActive: {
        type: Boolean,
        default: true,
    },
    // 解析和提示
    explanation: {
        type: String,
    },
    hints: [{
        type: String,
    }],
    // 相关资源
    relatedResources: [{
        title: String,
        url: String,
        type: String
    }]
}, { timestamps: true });

// 创建索引
questionSchema.index({ subject: 1, type: 1, difficulty: 1 });
questionSchema.index({ knowledgePoints: 1 });

module.exports = mongoose.model("question", questionSchema);
