const mongoose = require("mongoose");

// 学生提交答案模型
const studentSubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true,
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assessment',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    // 提交的答案
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        studentAnswer: String,
        // 编程题代码
        code: String,
        // 代码执行结果
        executionResult: {
            output: String,
            errors: [String],
            testCaseResults: [{
                input: String,
                expectedOutput: String,
                actualOutput: String,
                passed: Boolean,
            }],
            executionTime: Number,
            memoryUsage: Number,
        },
        // AI自动评分
        autoGrading: {
            score: Number,
            maxScore: Number,
            feedback: String,
            // 错误分析
            errorAnalysis: {
                errorType: String,
                errorLocation: String,
                suggestion: String,
                relatedKnowledgePoints: [String],
            },
            // 代码质量分析（编程题）
            codeQuality: {
                complexity: String,
                readability: Number,
                efficiency: Number,
                bestPractices: [String],
                improvements: [String],
            }
        },
        // 教师手动评分
        manualGrading: {
            score: Number,
            feedback: String,
            gradedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'teacher',
            },
            gradedAt: Date,
        },
        // 最终得分
        finalScore: Number,
        isCorrect: Boolean,
    }],
    // 提交状态
    status: {
        type: String,
        enum: ['进行中', '已提交', '已评分', '需要重做'],
        default: '进行中'
    },
    // 时间记录
    startTime: {
        type: Date,
        default: Date.now,
    },
    submitTime: Date,
    // 总分
    totalScore: Number,
    maxTotalScore: Number,
    // 完成百分比
    completionPercentage: Number,
    // AI分析结果
    aiAnalysis: {
        // 知识掌握情况
        knowledgeMastery: [{
            knowledgePoint: String,
            masteryLevel: {
                type: String,
                enum: ['未掌握', '部分掌握', '基本掌握', '熟练掌握'],
            },
            confidence: Number, // 置信度 0-1
        }],
        // 学习建议
        learningRecommendations: [{
            area: String,
            suggestion: String,
            priority: {
                type: String,
                enum: ['低', '中', '高'],
            },
            resources: [String],
        }],
        // 错误模式分析
        errorPatterns: [{
            pattern: String,
            frequency: Number,
            impact: String,
            remediation: String,
        }],
        // 学习进度评估
        progressAssessment: {
            currentLevel: String,
            targetLevel: String,
            estimatedTimeToTarget: Number, // 小时
            nextSteps: [String],
        }
    },
    // 重做记录
    retakeHistory: [{
        retakeDate: Date,
        score: Number,
        improvements: [String],
    }]
}, { timestamps: true });

module.exports = mongoose.model("studentSubmission", studentSubmissionSchema);
