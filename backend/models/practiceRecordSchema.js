const mongoose = require("mongoose");

const practiceRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true,
    },
    exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exercise',
        required: false, // AI动态练习不需要关联固定练习
    },
    // 练习类型
    practiceType: {
        type: String,
        enum: ['fixed', 'adaptive', 'ai_generated', 'custom'],
        default: 'adaptive',
        required: true
    },
    // 练习会话信息
    sessionId: {
        type: String,
        required: true,
    },
    // 动态生成的题目存储
    sessionQuestions: [{
        id: String,
        title: String,
        question: String,
        content: String,
        type: String,
        difficulty: String,
        points: Number,
        knowledgePoints: [String],
        expectedTime: Number,
        options: [String],
        correctAnswer: String,
        explanation: String,
        hints: [String]
    }],
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
    },
    totalTime: {
        type: Number, // in seconds
        default: 0,
    },
    // 答题记录
    answers: [{
        question: {
            type: mongoose.Schema.Types.Mixed, // 支持ObjectId和String
            required: true
        },
        answer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        score: Number,
        timeSpent: Number, // in seconds
        attempts: Number,
        hints: [{
            hintText: String,
            usedAt: Date
        }]
    }],
    // 总体成绩
    totalScore: {
        type: Number,
        default: 0,
    },
    maxScore: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
        default: 0,
    },
    // 完成状态
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned', 'timeout'],
        default: 'in_progress'
    },
    // 自适应练习相关
    adaptiveData: {
        initialDifficulty: String,
        finalDifficulty: String,
        difficultyAdjustments: [{
            questionIndex: Number,
            oldDifficulty: String,
            newDifficulty: String,
            reason: String,
            timestamp: Date
        }],
        performancePattern: String // 'improving', 'stable', 'declining'
    },
    // AI分析和反馈
    aiAnalysis: {
        strengths: [String],
        weaknesses: [String],
        recommendations: [String],
        nextPracticeLevel: String,
        focusAreas: [String],
        estimatedMastery: {
            type: Number, // 0-100
            default: 0
        }
    },
    // 错误分析
    errorAnalysis: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'question'
        },
        errorType: String,
        errorPattern: String,
        frequency: Number,
        suggestion: String
    }],
    // 学习进度
    learningProgress: {
        knowledgePointsMastered: [String],
        skillsImproved: [String],
        conceptsNeedReview: [String],
        overallProgress: Number // 0-100
    }
}, { timestamps: true });

// 创建索引
practiceRecordSchema.index({ student: 1, createdAt: -1 });
practiceRecordSchema.index({ exercise: 1, student: 1 });
practiceRecordSchema.index({ sessionId: 1 }, { unique: true });

module.exports = mongoose.model("practiceRecord", practiceRecordSchema);
