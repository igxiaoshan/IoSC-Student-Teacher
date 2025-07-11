const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
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
    // 考试时间设置
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        required: true,
    },
    // 题目设置
    questions: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'question',
            required: true
        },
        points: {
            type: Number,
            default: 1
        },
        order: {
            type: Number,
            required: true
        }
    }],
    totalPoints: {
        type: Number,
        required: true,
    },
    // 考试设置
    settings: {
        shuffleQuestions: {
            type: Boolean,
            default: false
        },
        shuffleOptions: {
            type: Boolean,
            default: false
        },
        allowReview: {
            type: Boolean,
            default: true
        },
        showResultsImmediately: {
            type: Boolean,
            default: false
        },
        allowMultipleAttempts: {
            type: Boolean,
            default: false
        },
        maxAttempts: {
            type: Number,
            default: 1
        },
        passingScore: {
            type: Number,
            default: 60
        }
    },
    // 状态
    status: {
        type: String,
        enum: ['draft', 'published', 'active', 'completed', 'cancelled'],
        default: 'draft'
    },
    // AI生成相关
    aiGenerated: {
        type: Boolean,
        default: false,
    },
    generationPrompt: {
        type: String,
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
        passRate: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("exam", examSchema);
