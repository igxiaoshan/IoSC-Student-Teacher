/**
 * 练习题库数据模型
 * 用于存储AI生成和教师创建的练习题
 */

const mongoose = require('mongoose');

const exerciseBankSchema = new mongoose.Schema({
    // 学科
    subject: {
        type: String,
        required: true,
        index: true
    },
    
    // 章节
    chapter: {
        type: String,
        required: true,
        index: true
    },
    
    // 题目类型
    questionType: {
        type: String,
        enum: ['选择题', '填空题', '简答题', '计算题', '编程题', '判断题'],
        required: true,
        index: true
    },
    
    // 题目内容
    question: {
        type: String,
        required: true,
        maxlength: 2000
    },
    
    // 选项（适用于选择题）
    options: [{
        label: {
            type: String,
            enum: ['A', 'B', 'C', 'D', 'E', 'F']
        },
        content: {
            type: String,
            maxlength: 500
        }
    }],
    
    // 正确答案
    correctAnswer: {
        type: String,
        required: true,
        maxlength: 1000
    },
    
    // 详细解析
    explanation: {
        type: String,
        maxlength: 2000
    },
    
    // 难度等级 (1-5)
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
        index: true
    },
    
    // 相关知识点
    knowledgePoints: [{
        type: String,
        maxlength: 100,
        index: true
    }],
    
    // 创建者
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'creatorType',
        required: true
    },
    
    // 创建者类型
    creatorType: {
        type: String,
        enum: ['teacher', 'admin', 'system'],
        required: true,
        default: 'teacher'
    },
    
    // 是否AI生成
    isAIGenerated: {
        type: Boolean,
        default: false
    },
    
    // AI生成的原始提示
    aiPrompt: {
        type: String,
        maxlength: 1000
    },
    
    // 题目标签
    tags: [{
        type: String,
        maxlength: 50
    }],
    
    // 预计完成时间（分钟）
    estimatedTime: {
        type: Number,
        min: 1,
        default: 5
    },
    
    // 使用统计
    usageStats: {
        // 被使用次数
        usedCount: {
            type: Number,
            default: 0
        },
        // 正确率
        correctRate: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        },
        // 平均完成时间
        averageTime: {
            type: Number,
            default: 0
        },
        // 最后使用时间
        lastUsed: {
            type: Date
        }
    },
    
    // 质量评分
    qualityScore: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    
    // 状态
    status: {
        type: String,
        enum: ['草稿', '已发布', '已归档', '需要审核'],
        default: '草稿'
    },
    
    // 审核信息
    reviewInfo: {
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'teacher'
        },
        reviewedAt: Date,
        reviewComments: String,
        isApproved: Boolean
    },
    
    // 相关题目（推荐相似题目）
    relatedQuestions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExerciseBank'
    }],
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'exercisebank'
});

// 创建复合索引
exerciseBankSchema.index({ subject: 1, chapter: 1, difficulty: 1 });
exerciseBankSchema.index({ questionType: 1, status: 1 });
exerciseBankSchema.index({ knowledgePoints: 1, difficulty: 1 });
exerciseBankSchema.index({ 'usageStats.correctRate': 1 });
exerciseBankSchema.index({ qualityScore: -1 });

// 中间件：更新时间
exerciseBankSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 实例方法：更新使用统计
exerciseBankSchema.methods.updateUsageStats = function(isCorrect, timeSpent) {
    this.usageStats.usedCount += 1;
    this.usageStats.lastUsed = new Date();
    
    // 更新正确率
    const totalAttempts = this.usageStats.usedCount;
    const currentCorrectCount = this.usageStats.correctRate * (totalAttempts - 1);
    const newCorrectCount = currentCorrectCount + (isCorrect ? 1 : 0);
    this.usageStats.correctRate = newCorrectCount / totalAttempts;
    
    // 更新平均时间
    const currentTotalTime = this.usageStats.averageTime * (totalAttempts - 1);
    this.usageStats.averageTime = (currentTotalTime + timeSpent) / totalAttempts;
    
    return this.save();
};

// 实例方法：计算质量评分
exerciseBankSchema.methods.calculateQualityScore = function() {
    let score = 0;
    
    // 基于使用次数 (0-1分)
    const usageScore = Math.min(this.usageStats.usedCount / 100, 1);
    score += usageScore;
    
    // 基于正确率 (0-2分，正确率在0.3-0.7之间得分最高)
    const correctRate = this.usageStats.correctRate;
    let correctnessScore = 0;
    if (correctRate >= 0.3 && correctRate <= 0.7) {
        correctnessScore = 2;
    } else if (correctRate >= 0.2 && correctRate <= 0.8) {
        correctnessScore = 1.5;
    } else if (correctRate >= 0.1 && correctRate <= 0.9) {
        correctnessScore = 1;
    } else {
        correctnessScore = 0.5;
    }
    score += correctnessScore;
    
    // 基于内容完整性 (0-2分)
    let contentScore = 0;
    if (this.explanation && this.explanation.length > 50) contentScore += 1;
    if (this.knowledgePoints && this.knowledgePoints.length > 0) contentScore += 0.5;
    if (this.tags && this.tags.length > 0) contentScore += 0.5;
    score += contentScore;
    
    this.qualityScore = Math.round(score * 10) / 10; // 保留一位小数
    return this.save();
};

// 静态方法：根据学生历史生成推荐题目
exerciseBankSchema.statics.getRecommendedQuestions = function(studentId, subject, count = 5) {
    // 这里需要结合学习记录来推荐
    return this.find({
        subject: subject,
        status: '已发布'
    })
    .sort({ qualityScore: -1, 'usageStats.usedCount': -1 })
    .limit(count);
};

// 静态方法：按难度获取题目
exerciseBankSchema.statics.getQuestionsByDifficulty = function(subject, chapter, difficulty, count = 10) {
    return this.find({
        subject: subject,
        chapter: chapter,
        difficulty: difficulty,
        status: '已发布'
    })
    .sort({ qualityScore: -1 })
    .limit(count);
};

// 静态方法：搜索题目
exerciseBankSchema.statics.searchQuestions = function(query, filters = {}) {
    const searchConditions = { status: '已发布' };
    
    // 文本搜索
    if (query) {
        searchConditions.$or = [
            { question: { $regex: query, $options: 'i' } },
            { knowledgePoints: { $in: [new RegExp(query, 'i')] } },
            { tags: { $in: [new RegExp(query, 'i')] } }
        ];
    }
    
    // 应用过滤器
    if (filters.subject) searchConditions.subject = filters.subject;
    if (filters.chapter) searchConditions.chapter = filters.chapter;
    if (filters.questionType) searchConditions.questionType = filters.questionType;
    if (filters.difficulty) searchConditions.difficulty = filters.difficulty;
    if (filters.knowledgePoints) {
        searchConditions.knowledgePoints = { $in: filters.knowledgePoints };
    }
    
    return this.find(searchConditions)
        .sort({ qualityScore: -1, createdAt: -1 });
};

// 静态方法：获取题目统计
exerciseBankSchema.statics.getQuestionStats = function(subject) {
    return this.aggregate([
        {
            $match: { subject: subject, status: '已发布' }
        },
        {
            $group: {
                _id: {
                    chapter: '$chapter',
                    difficulty: '$difficulty',
                    questionType: '$questionType'
                },
                count: { $sum: 1 },
                averageQuality: { $avg: '$qualityScore' },
                averageCorrectRate: { $avg: '$usageStats.correctRate' }
            }
        },
        {
            $sort: { '_id.chapter': 1, '_id.difficulty': 1 }
        }
    ]);
};

// 静态方法：获取热门知识点
exerciseBankSchema.statics.getPopularKnowledgePoints = function(subject, limit = 20) {
    return this.aggregate([
        {
            $match: { subject: subject, status: '已发布' }
        },
        {
            $unwind: '$knowledgePoints'
        },
        {
            $group: {
                _id: '$knowledgePoints',
                questionCount: { $sum: 1 },
                averageDifficulty: { $avg: '$difficulty' },
                averageQuality: { $avg: '$qualityScore' }
            }
        },
        {
            $sort: { questionCount: -1 }
        },
        {
            $limit: limit
        },
        {
            $project: {
                knowledgePoint: '$_id',
                questionCount: 1,
                averageDifficulty: { $round: ['$averageDifficulty', 1] },
                averageQuality: { $round: ['$averageQuality', 1] }
            }
        }
    ]);
};

module.exports = mongoose.model('ExerciseBank', exerciseBankSchema);
