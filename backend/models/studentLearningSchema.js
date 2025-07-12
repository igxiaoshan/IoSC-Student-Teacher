const mongoose = require('mongoose');

// 学生学习记录模型
const studentLearningSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    
    // 学习会话记录
    learningConversations: [{
        conversationId: String,
        startTime: { type: Date, default: Date.now },
        endTime: Date,
        messageCount: { type: Number, default: 0 },
        topic: String, // 讨论的主题
        messages: [{
            messageId: String,
            timestamp: { type: Date, default: Date.now },
            userMessage: String,
            aiResponse: String,
            messageType: {
                type: String,
                enum: ['question', 'explanation', 'practice', 'evaluation'],
                default: 'question'
            },
            satisfaction: {
                type: Number,
                min: 1,
                max: 5
            }
        }]
    }],

    // 练习记录
    practiceHistory: [{
        practiceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        generatedAt: { type: Date, default: Date.now },
        completedAt: Date,
        
        // 练习配置
        practiceConfig: {
            chapterContent: String,
            difficulty: {
                type: String,
                enum: ['简单', '中等', '困难'],
                default: '中等'
            },
            questionCount: { type: Number, default: 5 },
            questionTypes: [String],
            focusAreas: [String]
        },

        // 生成的题目
        questions: [{
            questionId: String,
            questionText: String,
            questionType: {
                type: String,
                enum: ['选择题', '填空题', '简答题', '计算题', '编程题']
            },
            options: [{
                text: String,
                isCorrect: Boolean
            }],
            correctAnswer: String,
            explanation: String,
            difficulty: String,
            points: { type: Number, default: 10 },
            knowledgePoints: [String],
            
            // 学生答题记录
            studentAnswer: String,
            submittedAt: Date,
            timeTaken: Number, // 答题用时（秒）
            
            // AI评估结果
            evaluation: {
                isCorrect: Boolean,
                score: Number,
                feedback: String,
                errorAnalysis: {
                    errorType: String,
                    errorLocation: String,
                    suggestion: String,
                    relatedConcepts: [String]
                },
                detailedExplanation: String
            }
        }],

        // 练习统计
        practiceStats: {
            totalQuestions: Number,
            correctAnswers: Number,
            totalScore: Number,
            maxScore: Number,
            accuracy: Number, // 正确率
            averageTime: Number, // 平均答题时间
            completionRate: Number // 完成率
        }
    }],

    // 学习进度跟踪
    learningProgress: {
        // 知识点掌握情况
        knowledgeMastery: [{
            knowledgePoint: String,
            masteryLevel: {
                type: String,
                enum: ['未学习', '初步了解', '基本掌握', '熟练掌握', '精通'],
                default: '未学习'
            },
            practiceCount: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            lastPracticeDate: Date,
            masteryScore: { type: Number, default: 0 }, // 0-100
            confidence: { type: Number, default: 0 } // 0-1
        }],

        // 薄弱环节
        weakAreas: [{
            area: String,
            errorCount: Number,
            lastErrorDate: Date,
            improvementSuggestions: [String],
            practiceRecommendations: [String]
        }],

        // 学习目标
        learningGoals: [{
            goal: String,
            targetDate: Date,
            currentProgress: { type: Number, default: 0 }, // 0-100
            status: {
                type: String,
                enum: ['进行中', '已完成', '已暂停'],
                default: '进行中'
            }
        }],

        // 学习统计
        overallStats: {
            totalStudyTime: { type: Number, default: 0 }, // 总学习时间（分钟）
            totalQuestions: { type: Number, default: 0 },
            totalCorrect: { type: Number, default: 0 },
            overallAccuracy: { type: Number, default: 0 },
            streakDays: { type: Number, default: 0 }, // 连续学习天数
            lastStudyDate: Date,
            averageSessionTime: { type: Number, default: 0 }
        }
    },

    // AI学习建议
    aiRecommendations: [{
        generatedAt: { type: Date, default: Date.now },
        recommendationType: {
            type: String,
            enum: ['study_plan', 'practice_focus', 'review_reminder', 'difficulty_adjustment']
        },
        content: String,
        priority: {
            type: String,
            enum: ['低', '中', '高'],
            default: '中'
        },
        status: {
            type: String,
            enum: ['待处理', '已查看', '已采纳', '已忽略'],
            default: '待处理'
        },
        validUntil: Date
    }],

    // 学习偏好设置
    learningPreferences: {
        preferredDifficulty: {
            type: String,
            enum: ['简单', '中等', '困难'],
            default: '中等'
        },
        preferredQuestionTypes: [String],
        studyReminders: {
            enabled: { type: Boolean, default: true },
            frequency: {
                type: String,
                enum: ['每天', '每周', '自定义'],
                default: '每天'
            },
            preferredTime: String // 格式: "HH:MM"
        },
        feedbackPreference: {
            type: String,
            enum: ['简洁', '详细', '图文并茂'],
            default: '详细'
        }
    }
}, { 
    timestamps: true,
    // 添加索引以提高查询性能
    index: [
        { student: 1, subject: 1 },
        { 'practiceHistory.generatedAt': -1 },
        { 'learningConversations.startTime': -1 }
    ]
});

// 添加虚拟字段
studentLearningSchema.virtual('recentPerformance').get(function() {
    const recentPractices = this.practiceHistory
        .slice(-5) // 最近5次练习
        .map(practice => ({
            date: practice.generatedAt,
            accuracy: practice.practiceStats?.accuracy || 0,
            score: practice.practiceStats?.totalScore || 0
        }));
    
    return recentPractices;
});

// 实例方法：更新知识点掌握情况
studentLearningSchema.methods.updateKnowledgeMastery = function(knowledgePoint, isCorrect) {
    let mastery = this.learningProgress.knowledgeMastery.find(
        km => km.knowledgePoint === knowledgePoint
    );
    
    if (!mastery) {
        mastery = {
            knowledgePoint,
            masteryLevel: '初步了解',
            practiceCount: 0,
            correctCount: 0,
            masteryScore: 0,
            confidence: 0
        };
        this.learningProgress.knowledgeMastery.push(mastery);
    }
    
    mastery.practiceCount += 1;
    if (isCorrect) {
        mastery.correctCount += 1;
    }
    
    mastery.lastPracticeDate = new Date();
    
    // 计算掌握分数
    const accuracy = mastery.correctCount / mastery.practiceCount;
    mastery.masteryScore = Math.round(accuracy * 100);
    
    // 更新掌握等级
    if (mastery.masteryScore >= 90) {
        mastery.masteryLevel = '精通';
    } else if (mastery.masteryScore >= 75) {
        mastery.masteryLevel = '熟练掌握';
    } else if (mastery.masteryScore >= 60) {
        mastery.masteryLevel = '基本掌握';
    } else {
        mastery.masteryLevel = '初步了解';
    }
    
    return mastery;
};

// 静态方法：获取学生的学习统计
studentLearningSchema.statics.getStudentStats = function(studentId, subjectId) {
    return this.findOne({ student: studentId, subject: subjectId })
        .populate('student', 'name rollNum')
        .populate('subject', 'subName')
        .select('learningProgress.overallStats practiceHistory');
};

module.exports = mongoose.model("studentLearning", studentLearningSchema);
