const mongoose = require('mongoose');

// 实训练习题目Schema
const practicalQuestionSchema = new mongoose.Schema({
    questionNumber: {
        type: Number,
        required: true
    },
    questionType: {
        type: String,
        required: true,
        enum: ['实操题', '编程题', '案例分析', '项目实战', '调试题', '设计题'],
        default: '实操题'
    },
    questionText: {
        type: String,
        required: true
    },
    // 实训要求和步骤
    requirements: [{
        step: Number,
        description: String,
        expectedOutput: String
    }],
    // 参考答案
    referenceAnswer: {
        type: String,
        required: true
    },
    // 代码模板（编程题专用）
    codeTemplate: {
        language: String,
        template: String,
        testCases: [{
            input: String,
            expectedOutput: String,
            description: String
        }]
    },
    // 评分标准
    gradingCriteria: [{
        criterion: String,
        points: Number,
        description: String
    }],
    // 解析说明
    explanation: {
        type: String,
        required: true
    },
    // 难度等级
    difficulty: {
        type: String,
        enum: ['初级', '中级', '高级'],
        default: '中级'
    },
    // 分值
    points: {
        type: Number,
        default: 20
    },
    // 预计完成时间（分钟）
    estimatedTime: {
        type: Number,
        default: 30
    },
    // 相关知识点
    knowledgePoints: [String],
    // 实训环境要求
    environmentRequirements: {
        software: [String],
        hardware: [String],
        platforms: [String]
    }
});

// 实训练习Schema
const practicalExerciseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // 关联的课件
    courseware: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'courseware',
        required: true
    },
    // 创建教师
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true
    },
    // 学科
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true
    },
    // 学校
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    // 练习题目
    questions: [practicalQuestionSchema],
    // 总分
    totalPoints: {
        type: Number,
        default: 100
    },
    // 建议完成时间（分钟）
    duration: {
        type: Number,
        default: 120
    },
    // 难度等级
    difficulty: {
        type: String,
        enum: ['初级', '中级', '高级'],
        default: '中级'
    },
    // 实训类型
    exerciseType: {
        type: String,
        enum: ['综合实训', '专项练习', '项目实战', '技能考核'],
        default: '综合实训'
    },
    // 目标技能
    targetSkills: [String],
    // 是否AI生成
    isAIGenerated: {
        type: Boolean,
        default: true
    },
    // AI生成参数
    generationParams: {
        basedOnCourseware: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Courseware'
        },
        difficulty: String,
        questionCount: Number,
        questionTypes: [String],
        focusAreas: [String],
        dataSource: String // 'dify', 'mock'
    },
    // 状态
    status: {
        type: String,
        enum: ['草稿', '已发布', '已归档', '已删除'],
        default: '草稿'
    },
    // 发布时间
    publishedAt: {
        type: Date
    },
    // 软删除时间
    deletedAt: {
        type: Date
    },
    // 使用统计
    usageStats: {
        viewCount: { type: Number, default: 0 },
        downloadCount: { type: Number, default: 0 },
        shareCount: { type: Number, default: 0 },
        completionCount: { type: Number, default: 0 }
    },
    // 标签
    tags: [String],
    // 创建和更新时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 更新时间中间件
practicalExerciseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// 索引
practicalExerciseSchema.index({ teacher: 1, createdAt: -1 });
practicalExerciseSchema.index({ subject: 1, difficulty: 1 });
practicalExerciseSchema.index({ status: 1, createdAt: -1 });
practicalExerciseSchema.index({ 'generationParams.basedOnCourseware': 1 });

module.exports = mongoose.model('practicalExercise', practicalExerciseSchema);
