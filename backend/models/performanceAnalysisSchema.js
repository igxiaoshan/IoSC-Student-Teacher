const mongoose = require("mongoose");

const performanceAnalysisSchema = new mongoose.Schema({
    // 分析目标
    analysisType: {
        type: String,
        enum: ['student_individual', 'class_overview', 'subject_analysis', 'teacher_effectiveness', 'school_summary'],
        required: true,
    },
    // 关联对象
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetType'
    },
    targetType: {
        type: String,
        required: true,
        enum: ['student', 'sclass', 'subject', 'teacher', 'admin']
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    // 分析时间范围
    analysisDate: {
        type: Date,
        required: true,
    },
    periodType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'semester', 'custom'],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    // 学习效果分析
    learningEffectiveness: {
        // 平均正确率趋势
        averageAccuracy: {
            current: Number,
            previous: Number,
            trend: String, // 'improving', 'stable', 'declining'
            changePercentage: Number
        },
        // 知识点掌握情况
        knowledgePointMastery: [{
            knowledgePoint: String,
            masteryLevel: Number, // 0-100
            practiceCount: Number,
            averageScore: Number,
            improvementRate: Number,
            status: String // 'mastered', 'learning', 'needs_review'
        }],
        // 高频错误知识点
        frequentErrors: [{
            knowledgePoint: String,
            errorCount: Number,
            errorRate: Number,
            commonMistakes: [String],
            suggestions: [String]
        }],
        // 学习进度
        learningProgress: {
            completedTopics: Number,
            totalTopics: Number,
            progressPercentage: Number,
            estimatedCompletionDate: Date
        }
    },
    // 教学效率分析（针对教师）
    teachingEfficiency: {
        // 备课时间统计
        lessonPrepTime: {
            averageTime: Number, // in minutes
            totalTime: Number,
            aiAssistedTime: Number,
            manualTime: Number,
            efficiency: Number // aiAssistedTime / totalTime
        },
        // 课后练习设计时间
        exerciseDesignTime: {
            averageTime: Number,
            totalTime: Number,
            aiGeneratedCount: Number,
            manualCreatedCount: Number
        },
        // 学生表现
        studentPerformance: {
            classAverageScore: Number,
            passRate: Number,
            improvementRate: Number,
            engagementLevel: Number
        },
        // 课程优化建议
        optimizationSuggestions: [{
            area: String, // 'content', 'method', 'pacing', 'assessment'
            issue: String,
            suggestion: String,
            priority: String // 'high', 'medium', 'low'
        }]
    },
    // 使用统计
    usageStatistics: {
        // 活跃度统计
        activityStats: {
            totalSessions: Number,
            averageSessionDuration: Number, // in minutes
            mostActiveHours: [Number],
            mostActiveWeekdays: [Number]
        },
        // 功能使用统计
        featureUsage: [{
            feature: String,
            usageCount: Number,
            usageTime: Number, // in minutes
            successRate: Number
        }],
        // AI功能使用
        aiUsage: {
            totalQueries: Number,
            contentGenerated: Number,
            analysisRequests: Number,
            averageResponseTime: Number,
            satisfactionScore: Number
        }
    },
    // AI生成的洞察和建议
    aiInsights: {
        keyFindings: [String],
        recommendations: [{
            category: String,
            recommendation: String,
            expectedImpact: String,
            implementationDifficulty: String
        }],
        predictiveAnalysis: {
            riskFactors: [String],
            successPredictors: [String],
            recommendedActions: [String]
        }
    },
    // 数据质量和置信度
    dataQuality: {
        sampleSize: Number,
        confidenceLevel: Number,
        dataCompleteness: Number, // 0-100
        analysisReliability: String // 'high', 'medium', 'low'
    }
}, { timestamps: true });

// 创建索引
performanceAnalysisSchema.index({ targetId: 1, targetType: 1, analysisDate: -1 });
performanceAnalysisSchema.index({ school: 1, analysisType: 1, analysisDate: -1 });
performanceAnalysisSchema.index({ analysisDate: -1, periodType: 1 });

module.exports = mongoose.model("performanceAnalysis", performanceAnalysisSchema);
