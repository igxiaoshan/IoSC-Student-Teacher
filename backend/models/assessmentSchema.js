const mongoose = require("mongoose");

// 考核题目模型
const assessmentSchema = new mongoose.Schema({
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
    // 题目类型
    questionType: {
        type: String,
        enum: ['选择题', '填空题', '简答题', '编程题', '实操题', '综合题'],
        required: true,
    },
    // 题目内容
    questions: [{
        questionText: {
            type: String,
            required: true,
        },
        questionType: {
            type: String,
            enum: ['选择题', '填空题', '简答题', '编程题', '实操题'],
            required: true,
        },
        // 选择题选项
        options: [{
            text: String,
            isCorrect: Boolean,
        }],
        // 正确答案
        correctAnswer: String,
        // 参考答案（用于主观题）
        referenceAnswer: String,
        // 评分标准
        gradingCriteria: [{
            criterion: String,
            points: Number,
            description: String,
        }],
        // 难度等级
        difficulty: {
            type: String,
            enum: ['初级', '中级', '高级'],
            default: '中级'
        },
        // 知识点标签
        knowledgePoints: [String],
        // 分值
        points: {
            type: Number,
            required: true,
        },
        // 预计完成时间
        estimatedTime: Number,
        // 编程题特有字段
        programmingDetails: {
            language: String, // 编程语言
            template: String, // 代码模板
            testCases: [{
                input: String,
                expectedOutput: String,
                isHidden: Boolean, // 是否为隐藏测试用例
            }],
            constraints: String, // 约束条件
        }
    }],
    // 总分
    totalPoints: {
        type: Number,
        required: true,
    },
    // 考试时长（分钟）
    duration: {
        type: Number,
        required: true,
    },
    // AI生成标记
    isAIGenerated: {
        type: Boolean,
        default: false,
    },
    // 生成参数
    generationParams: {
        basedOnCourseware: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'courseware',
        },
        difficulty: String,
        questionCount: Number,
        focusAreas: [String],
    },
    // 使用统计
    usageStats: {
        assignedCount: { type: Number, default: 0 },
        completedCount: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        lastUsed: Date,
    },
    status: {
        type: String,
        enum: ['草稿', '已发布', '已结束'],
        default: '草稿'
    }
}, { timestamps: true });

module.exports = mongoose.model("assessment", assessmentSchema);
