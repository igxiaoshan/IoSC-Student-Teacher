const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true,
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exam',
        required: true,
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'question',
        required: true,
    },
    // 学生答案
    answer: {
        type: mongoose.Schema.Types.Mixed, // 可以存储不同类型的答案
        required: true,
    },
    // 编程题代码
    code: {
        language: String,
        content: String,
        executionResult: {
            status: String, // 'success', 'error', 'timeout'
            output: String,
            error: String,
            executionTime: Number,
            memoryUsed: Number
        }
    },
    // 评分信息
    score: {
        type: Number,
        default: 0,
    },
    maxScore: {
        type: Number,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        default: false,
    },
    // AI评分和反馈
    aiEvaluation: {
        autoScore: Number,
        confidence: Number, // 0-1, AI评分的置信度
        feedback: String,
        suggestions: [String],
        errorAnalysis: {
            errorType: String,
            errorLocation: String,
            correctionSuggestion: String
        }
    },
    // 人工评分（如果需要）
    manualReview: {
        reviewed: {
            type: Boolean,
            default: false
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'teacher'
        },
        reviewedAt: Date,
        manualScore: Number,
        reviewComments: String
    },
    // 答题时间统计
    timeSpent: {
        type: Number, // in seconds
        default: 0,
    },
    startTime: {
        type: Date,
    },
    submitTime: {
        type: Date,
    },
    // 答题过程记录（可选）
    answerHistory: [{
        answer: mongoose.Schema.Types.Mixed,
        timestamp: Date
    }],
    // 状态
    status: {
        type: String,
        enum: ['in_progress', 'submitted', 'graded', 'reviewed'],
        default: 'in_progress'
    }
}, { timestamps: true });

// 创建复合索引
answerSchema.index({ student: 1, exam: 1, question: 1 }, { unique: true });
answerSchema.index({ exam: 1, student: 1 });

module.exports = mongoose.model("answer", answerSchema);
