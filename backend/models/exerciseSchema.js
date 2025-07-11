const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
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
    // 练习类型
    type: {
        type: String,
        enum: ['daily_practice', 'adaptive_practice', 'review_practice', 'challenge'],
        default: 'daily_practice'
    },
    // 题目列表
    questions: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'question',
            required: true
        },
        weight: {
            type: Number,
            default: 1
        }
    }],
    // 难度设置
    difficulty: {
        type: String,
        enum: ['adaptive', 'easy', 'medium', 'hard'],
        default: 'adaptive'
    },
    // 知识点覆盖
    knowledgePoints: [{
        type: String,
    }],
    // 自适应设置
    adaptiveSettings: {
        enabled: {
            type: Boolean,
            default: false
        },
        initialDifficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        adjustmentFactor: {
            type: Number,
            default: 0.1
        },
        minQuestions: {
            type: Number,
            default: 5
        },
        maxQuestions: {
            type: Number,
            default: 20
        }
    },
    // 时间限制
    timeLimit: {
        type: Number, // in minutes, 0 means no limit
        default: 0
    },
    // AI生成相关
    aiGenerated: {
        type: Boolean,
        default: false,
    },
    generationCriteria: {
        studentLevel: String,
        focusAreas: [String],
        weakPoints: [String],
        practiceGoal: String
    },
    // 状态
    isActive: {
        type: Boolean,
        default: true,
    },
    // 可用时间范围
    availableFrom: {
        type: Date,
    },
    availableTo: {
        type: Date,
    },
    // 统计信息
    statistics: {
        totalAttempts: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        averageTime: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("exercise", exerciseSchema);
