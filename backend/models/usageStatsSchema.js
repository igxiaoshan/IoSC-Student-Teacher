/**
 * 系统使用统计数据模型
 * 用于记录用户使用系统各功能的统计信息
 */

const mongoose = require('mongoose');

const usageStatsSchema = new mongoose.Schema({
    // 用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    
    // 用户角色
    userRole: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true,
        index: true
    },
    
    // 功能模块
    feature: {
        type: String,
        required: true,
        index: true,
        enum: [
            // 学生功能
            'learning_assistant',      // 学习助手
            'exercise_generator',      // 练习生成
            'answer_checker',         // 答案检查
            'learning_history',       // 学习历史
            'performance_view',       // 成绩查看
            'attendance_view',        // 考勤查看
            
            // 教师功能
            'lesson_planning',        // 备课规划
            'exam_generation',        // 考核生成
            'student_analytics',      // 学情分析
            'resource_management',    // 资源管理
            'attendance_marking',     // 考勤标记
            'grade_management',       // 成绩管理
            
            // 管理员功能
            'user_management',        // 用户管理
            'system_analytics',       // 系统分析
            'resource_overview',      // 资源概览
            'usage_dashboard',        // 使用仪表板
            
            // 通用功能
            'login',                  // 登录
            'profile_management',     // 个人资料管理
            'notification_view'       // 通知查看
        ]
    },
    
    // 使用次数
    usageCount: {
        type: Number,
        default: 1,
        min: 0
    },
    
    // 累计使用时长（秒）
    totalDuration: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 最后使用时间
    lastUsed: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // 统计日期（用于按日统计）
    date: {
        type: Date,
        required: true,
        index: true
    },
    
    // 详细使用数据
    details: {
        // AI交互次数（针对AI功能）
        aiInteractions: {
            type: Number,
            default: 0
        },
        
        // 成功操作次数
        successfulOperations: {
            type: Number,
            default: 0
        },
        
        // 失败操作次数
        failedOperations: {
            type: Number,
            default: 0
        },
        
        // 平均响应时间（毫秒）
        averageResponseTime: {
            type: Number,
            default: 0
        },
        
        // 用户满意度评分 (1-5)
        satisfactionRating: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    
    // 设备信息
    deviceInfo: {
        deviceType: {
            type: String,
            enum: ['desktop', 'tablet', 'mobile'],
            default: 'desktop'
        },
        browser: String,
        os: String,
        screenResolution: String
    },
    
    // 会话信息
    sessionInfo: {
        sessionId: String,
        sessionDuration: Number, // 秒
        pagesVisited: Number,
        actionsPerformed: Number
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'usagestats'
});

// 创建复合索引
usageStatsSchema.index({ userId: 1, date: -1 });
usageStatsSchema.index({ userRole: 1, feature: 1, date: -1 });
usageStatsSchema.index({ feature: 1, date: -1 });
usageStatsSchema.index({ date: -1, userRole: 1 });

// 中间件：更新时间
usageStatsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 静态方法：记录使用情况
usageStatsSchema.statics.recordUsage = async function(userId, userRole, feature, duration = 0, details = {}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingRecord = await this.findOne({
        userId: userId,
        userRole: userRole,
        feature: feature,
        date: today
    });
    
    if (existingRecord) {
        // 更新现有记录
        existingRecord.usageCount += 1;
        existingRecord.totalDuration += duration;
        existingRecord.lastUsed = new Date();
        
        // 更新详细信息
        if (details.aiInteractions) {
            existingRecord.details.aiInteractions += details.aiInteractions;
        }
        if (details.successfulOperations) {
            existingRecord.details.successfulOperations += details.successfulOperations;
        }
        if (details.failedOperations) {
            existingRecord.details.failedOperations += details.failedOperations;
        }
        if (details.responseTime) {
            const totalResponseTime = existingRecord.details.averageResponseTime * (existingRecord.usageCount - 1);
            existingRecord.details.averageResponseTime = (totalResponseTime + details.responseTime) / existingRecord.usageCount;
        }
        
        return await existingRecord.save();
    } else {
        // 创建新记录
        return await this.create({
            userId: userId,
            userRole: userRole,
            feature: feature,
            usageCount: 1,
            totalDuration: duration,
            lastUsed: new Date(),
            date: today,
            details: {
                aiInteractions: details.aiInteractions || 0,
                successfulOperations: details.successfulOperations || 0,
                failedOperations: details.failedOperations || 0,
                averageResponseTime: details.responseTime || 0,
                satisfactionRating: details.satisfactionRating
            },
            deviceInfo: details.deviceInfo || {},
            sessionInfo: details.sessionInfo || {}
        });
    }
};

// 静态方法：获取用户活跃度统计
usageStatsSchema.statics.getUserActivityStats = function(timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    return this.aggregate([
        {
            $match: {
                date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    userRole: '$userRole',
                    userId: '$userId'
                },
                totalUsage: { $sum: '$usageCount' },
                totalDuration: { $sum: '$totalDuration' },
                featuresUsed: { $addToSet: '$feature' },
                lastActive: { $max: '$lastUsed' }
            }
        },
        {
            $group: {
                _id: '$_id.userRole',
                activeUsers: { $sum: 1 },
                totalUsage: { $sum: '$totalUsage' },
                totalDuration: { $sum: '$totalDuration' },
                averageUsagePerUser: { $avg: '$totalUsage' },
                averageDurationPerUser: { $avg: '$totalDuration' }
            }
        },
        {
            $project: {
                userRole: '$_id',
                activeUsers: 1,
                totalUsage: 1,
                totalDuration: 1,
                averageUsagePerUser: { $round: ['$averageUsagePerUser', 2] },
                averageDurationPerUser: { $round: ['$averageDurationPerUser', 2] }
            }
        }
    ]);
};

// 静态方法：获取功能使用排行
usageStatsSchema.statics.getFeatureUsageRanking = function(userRole = null, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    const matchConditions = { date: { $gte: startDate } };
    if (userRole) {
        matchConditions.userRole = userRole;
    }
    
    return this.aggregate([
        {
            $match: matchConditions
        },
        {
            $group: {
                _id: '$feature',
                totalUsage: { $sum: '$usageCount' },
                uniqueUsers: { $addToSet: '$userId' },
                totalDuration: { $sum: '$totalDuration' },
                averageDuration: { $avg: '$totalDuration' }
            }
        },
        {
            $project: {
                feature: '$_id',
                totalUsage: 1,
                uniqueUserCount: { $size: '$uniqueUsers' },
                totalDuration: 1,
                averageDuration: { $round: ['$averageDuration', 2] }
            }
        },
        {
            $sort: { totalUsage: -1 }
        }
    ]);
};

// 静态方法：获取使用趋势
usageStatsSchema.statics.getUsageTrend = function(feature = null, userRole = null, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const matchConditions = { date: { $gte: startDate } };
    if (feature) matchConditions.feature = feature;
    if (userRole) matchConditions.userRole = userRole;
    
    return this.aggregate([
        {
            $match: matchConditions
        },
        {
            $group: {
                _id: '$date',
                totalUsage: { $sum: '$usageCount' },
                uniqueUsers: { $addToSet: '$userId' },
                totalDuration: { $sum: '$totalDuration' }
            }
        },
        {
            $project: {
                date: '$_id',
                totalUsage: 1,
                uniqueUserCount: { $size: '$uniqueUsers' },
                totalDuration: 1
            }
        },
        {
            $sort: { date: 1 }
        }
    ]);
};

// 静态方法：获取AI功能使用统计
usageStatsSchema.statics.getAIUsageStats = function(timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    const aiFeatures = ['learning_assistant', 'exercise_generator', 'answer_checker', 
                       'lesson_planning', 'exam_generation', 'student_analytics'];
    
    return this.aggregate([
        {
            $match: {
                date: { $gte: startDate },
                feature: { $in: aiFeatures }
            }
        },
        {
            $group: {
                _id: {
                    feature: '$feature',
                    userRole: '$userRole'
                },
                totalUsage: { $sum: '$usageCount' },
                totalAIInteractions: { $sum: '$details.aiInteractions' },
                successfulOperations: { $sum: '$details.successfulOperations' },
                failedOperations: { $sum: '$details.failedOperations' },
                averageResponseTime: { $avg: '$details.averageResponseTime' }
            }
        },
        {
            $project: {
                feature: '$_id.feature',
                userRole: '$_id.userRole',
                totalUsage: 1,
                totalAIInteractions: 1,
                successRate: {
                    $cond: [
                        { $eq: [{ $add: ['$successfulOperations', '$failedOperations'] }, 0] },
                        0,
                        { $divide: ['$successfulOperations', { $add: ['$successfulOperations', '$failedOperations'] }] }
                    ]
                },
                averageResponseTime: { $round: ['$averageResponseTime', 2] }
            }
        },
        {
            $sort: { totalUsage: -1 }
        }
    ]);
};

module.exports = mongoose.model('UsageStats', usageStatsSchema);
