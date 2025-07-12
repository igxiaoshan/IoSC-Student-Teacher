/**
 * 学习记录数据模型
 * 用于记录学生的AI学习交互历史
 */

const mongoose = require('mongoose');

const learningRecordSchema = new mongoose.Schema({
    // 学生信息
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true,
        index: true
    },
    
    // 学科信息
    subject: {
        type: String,
        required: true,
        index: true
    },
    
    // 问题类型
    questionType: {
        type: String,
        enum: ['学习问答', '练习题目', '答案检查', '知识点查询'],
        required: true,
        default: '学习问答'
    },
    
    // 学生提出的问题
    question: {
        type: String,
        required: true,
        maxlength: 2000
    },
    
    // 学生的答案（如果是练习题）
    studentAnswer: {
        type: String,
        maxlength: 2000
    },
    
    // AI的回复
    aiResponse: {
        type: String,
        required: true,
        maxlength: 5000
    },
    
    // 答案是否正确（针对练习题）
    isCorrect: {
        type: Boolean,
        default: null
    },
    
    // 题目难度等级 (1-5)
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    
    // 相关知识点标签
    knowledgePoints: [{
        type: String,
        maxlength: 100
    }],
    
    // 学习会话ID（用于关联对话）
    conversationId: {
        type: String,
        index: true
    },
    
    // AI消息ID
    messageId: {
        type: String
    },
    
    // 学习时长（秒）
    studyDuration: {
        type: Number,
        default: 0
    },
    
    // 学生反馈评分 (1-5星)
    studentRating: {
        type: Number,
        min: 1,
        max: 5
    },
    
    // 学生反馈内容
    studentFeedback: {
        type: String,
        maxlength: 500
    },
    
    // 是否已复习
    isReviewed: {
        type: Boolean,
        default: false
    },
    
    // 复习次数
    reviewCount: {
        type: Number,
        default: 0
    },
    
    // 最后复习时间
    lastReviewAt: {
        type: Date
    },
    
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
    collection: 'learningrecords'
});

// 创建复合索引
learningRecordSchema.index({ studentId: 1, subject: 1, createdAt: -1 });
learningRecordSchema.index({ questionType: 1, createdAt: -1 });
learningRecordSchema.index({ knowledgePoints: 1 });

// 中间件：更新时间
learningRecordSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 实例方法：标记为已复习
learningRecordSchema.methods.markAsReviewed = function() {
    this.isReviewed = true;
    this.reviewCount += 1;
    this.lastReviewAt = new Date();
    return this.save();
};

// 静态方法：获取学生学习统计
learningRecordSchema.statics.getStudentStats = function(studentId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    return this.aggregate([
        {
            $match: {
                studentId: mongoose.Types.ObjectId(studentId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$subject',
                totalQuestions: { $sum: 1 },
                correctAnswers: {
                    $sum: {
                        $cond: [{ $eq: ['$isCorrect', true] }, 1, 0]
                    }
                },
                averageDifficulty: { $avg: '$difficulty' },
                totalStudyTime: { $sum: '$studyDuration' },
                knowledgePoints: { $addToSet: '$knowledgePoints' }
            }
        },
        {
            $project: {
                subject: '$_id',
                totalQuestions: 1,
                correctAnswers: 1,
                accuracy: {
                    $cond: [
                        { $eq: ['$totalQuestions', 0] },
                        0,
                        { $divide: ['$correctAnswers', '$totalQuestions'] }
                    ]
                },
                averageDifficulty: { $round: ['$averageDifficulty', 2] },
                totalStudyTime: 1,
                knowledgePointsCount: { $size: { $ifNull: ['$knowledgePoints', []] } }
            }
        }
    ]);
};

// 静态方法：获取热门知识点
learningRecordSchema.statics.getPopularKnowledgePoints = function(subject, limit = 10) {
    return this.aggregate([
        {
            $match: { subject: subject }
        },
        {
            $unwind: '$knowledgePoints'
        },
        {
            $group: {
                _id: '$knowledgePoints',
                count: { $sum: 1 },
                averageDifficulty: { $avg: '$difficulty' }
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $limit: limit
        },
        {
            $project: {
                knowledgePoint: '$_id',
                questionCount: '$count',
                averageDifficulty: { $round: ['$averageDifficulty', 2] }
            }
        }
    ]);
};

// 静态方法：获取学习趋势
learningRecordSchema.statics.getLearningTrend = function(studentId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        {
            $match: {
                studentId: mongoose.Types.ObjectId(studentId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                questionCount: { $sum: 1 },
                studyTime: { $sum: '$studyDuration' },
                correctCount: {
                    $sum: {
                        $cond: [{ $eq: ['$isCorrect', true] }, 1, 0]
                    }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        },
        {
            $project: {
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day'
                    }
                },
                questionCount: 1,
                studyTime: 1,
                correctCount: 1,
                accuracy: {
                    $cond: [
                        { $eq: ['$questionCount', 0] },
                        0,
                        { $divide: ['$correctCount', '$questionCount'] }
                    ]
                }
            }
        }
    ]);
};

module.exports = mongoose.model('LearningRecord', learningRecordSchema);
