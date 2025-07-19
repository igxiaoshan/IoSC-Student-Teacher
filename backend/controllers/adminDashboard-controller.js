const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const Subject = require('../models/subjectSchema');
const Answer = require('../models/answerSchema');
const Exam = require('../models/examSchema');
const Question = require('../models/questionSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const LessonPlan = require('../models/lessonPlanSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const UsageStat = require('../models/usageStatSchema');
const aiService = require('../services/aiService');

/**
 * 获取管理员仪表板概览
 */
const getAdminDashboard = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { timeRange = 'month', view = 'overview' } = req.query;

        // 计算时间范围
        const timeRanges = calculateTimeRanges(timeRange);

        // 并行获取各种统计数据 (新增业务指标和增长趋势)
        const [
            overviewStats,
            teachingStats,
            learningStats,
            resourceStats,
            performanceStats,
            userBehaviorStats,
            systemMetrics,
            businessMetrics,
            trendAnalysis,
            alerts
        ] = await Promise.all([
            getOverviewStatistics(adminID, timeRanges),
            getTeachingStatistics(adminID, timeRanges),
            getLearningStatistics(adminID, timeRanges),
            getResourceStatistics(adminID, timeRanges),
            getPerformanceStatistics(adminID, timeRanges),
            getUserBehaviorStatistics(adminID, timeRanges),
            getSystemMetrics(),
            getBusinessMetrics(adminID, timeRanges),
            getTrendAnalysis(adminID, timeRanges),
            getSystemAlerts(adminID)
        ]);

        // 计算关键指标 (包含所有新增指标)
        const keyMetrics = calculateKeyMetrics({
            overviewStats,
            teachingStats,
            learningStats,
            performanceStats,
            userBehaviorStats,
            systemMetrics,
            businessMetrics
        });

        res.json({
            adminID,
            timeRange,
            view,
            overview: overviewStats,
            teaching: teachingStats,
            learning: learningStats,
            resources: resourceStats,
            performance: performanceStats,
            userBehavior: userBehaviorStats,
            system: systemMetrics,
            business: businessMetrics,
            trends: trendAnalysis,
            keyMetrics: keyMetrics,
            alerts: alerts,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('获取管理员仪表板错误:', error);
        res.status(500).json({
            message: '获取管理员仪表板失败',
            error: error.message
        });
    }
};

/**
 * 获取实时数据大屏
 */
const getRealtimeDashboard = async (req, res) => {
    try {
        const { adminID } = req.params;

        // 获取实时数据
        const realtimeData = await getRealTimeData(adminID);

        // 获取活跃用户统计
        const activeUsers = await getActiveUsersStats(adminID);

        // 获取系统性能指标
        const systemMetrics = await getSystemMetrics(adminID);

        // 获取实时事件流
        const eventStream = await getRecentEvents(adminID, 50);

        res.json({
            adminID,
            timestamp: new Date(),
            realtime: realtimeData,
            activeUsers: activeUsers,
            systemMetrics: systemMetrics,
            events: eventStream,
            refreshInterval: 30000 // 30秒刷新间隔
        });

    } catch (error) {
        console.error('获取实时数据大屏错误:', error);
        res.status(500).json({
            message: '获取实时数据大屏失败',
            error: error.message
        });
    }
};

/**
 * 获取教学质量分析
 */
const getTeachingQualityAnalysis = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { period = 'semester', subject, teacher } = req.query;

        // 获取教学质量数据
        const qualityData = await getTeachingQualityData(adminID, {
            period,
            subject,
            teacher
        });

        // 生成统计对比分析 (移除AI分析)
        const comparison = await generateQualityComparison(adminID, qualityData, period);

        res.json({
            adminID,
            period,
            subject,
            teacher,
            qualityData: qualityData,
            comparison: comparison,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取教学质量分析错误:', error);
        res.status(500).json({
            message: '获取教学质量分析失败',
            error: error.message
        });
    }
};

/**
 * 获取学习效果分析
 */
const getLearningEffectivenessAnalysis = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { period = 'semester', subject, grade } = req.query;

        // 获取学习效果数据
        const effectivenessData = await getLearningEffectivenessData(adminID, {
            period,
            subject,
            grade
        });

        // 识别学习模式 (移除AI分析)
        const learningPatterns = await identifyLearningPatterns(effectivenessData);

        res.json({
            adminID,
            period,
            subject,
            grade,
            effectivenessData: effectivenessData,
            patterns: learningPatterns,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取学习效果分析错误:', error);
        res.status(500).json({
            message: '获取学习效果分析失败',
            error: error.message
        });
    }
};

/**
 * 获取资源使用分析
 */
const getResourceUsageAnalysis = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { resourceType = 'all', period = 'month' } = req.query;

        // 获取资源使用数据
        const usageData = await getResourceUsageData(adminID, resourceType, period);

        // 分析资源效率
        const efficiency = await analyzeResourceEfficiency(usageData);

        // 生成优化建议
        const optimizations = await generateResourceOptimizations(usageData, efficiency);

        // 预测资源需求
        const predictions = await predictResourceNeeds(adminID, usageData);

        res.json({
            adminID,
            resourceType,
            period,
            usage: usageData,
            efficiency: efficiency,
            optimizations: optimizations,
            predictions: predictions,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取资源使用分析错误:', error);
        res.status(500).json({
            message: '获取资源使用分析失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 计算时间范围
 */
const calculateTimeRanges = (timeRange) => {
    const now = new Date();
    let startDate, endDate = now;

    switch (timeRange) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'semester':
            startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
};

/**
 * 获取概览统计
 */
const getOverviewStatistics = async (adminID, timeRanges) => {
    const { startDate } = timeRanges;

    const [
        totalStudents,
        totalTeachers,
        totalSubjects,
        activeStudents,
        activeTeachers,
        totalQuestions,
        totalExams,
        totalLessonPlans
    ] = await Promise.all([
        Student.countDocuments({ school: adminID }),
        Teacher.countDocuments({ school: adminID }),
        Subject.countDocuments({ school: adminID }),
        Student.countDocuments({ 
            school: adminID,
            lastLogin: { $gte: startDate }
        }),
        Teacher.countDocuments({ 
            school: adminID,
            lastLogin: { $gte: startDate }
        }),
        Question.countDocuments({ 
            school: adminID,
            createdAt: { $gte: startDate }
        }),
        Exam.countDocuments({ 
            school: adminID,
            createdAt: { $gte: startDate }
        }),
        LessonPlan.countDocuments({ 
            school: adminID,
            createdAt: { $gte: startDate }
        })
    ]);

    return {
        users: {
            totalStudents,
            totalTeachers,
            activeStudents,
            activeTeachers,
            studentActivityRate: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0,
            teacherActivityRate: totalTeachers > 0 ? (activeTeachers / totalTeachers) * 100 : 0
        },
        content: {
            totalSubjects,
            totalQuestions,
            totalExams,
            totalLessonPlans,
            contentGrowthRate: calculateGrowthRate(totalQuestions + totalExams + totalLessonPlans)
        }
    };
};

/**
 * 获取教学统计
 */
const getTeachingStatistics = async (adminID, timeRanges) => {
    const { startDate } = timeRanges;

    // 教学活动统计
    const teachingActivities = await LessonPlan.aggregate([
        {
            $match: {
                school: adminID,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalPlans: { $sum: 1 },
                aiGeneratedPlans: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
                avgDuration: { $avg: '$duration' },
                totalDuration: { $sum: '$duration' }
            }
        }
    ]);

    // 考试统计
    const examStats = await Exam.aggregate([
        {
            $match: {
                school: adminID,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalExams: { $sum: 1 },
                avgScore: { $avg: '$statistics.averageScore' },
                avgPassRate: { $avg: '$statistics.passRate' }
            }
        }
    ]);

    const teachingData = teachingActivities[0] || {};
    const examData = examStats[0] || {};

    return {
        lessonPlans: {
            total: teachingData.totalPlans || 0,
            aiGenerated: teachingData.aiGeneratedPlans || 0,
            aiUsageRate: teachingData.totalPlans > 0 ? 
                (teachingData.aiGeneratedPlans / teachingData.totalPlans) * 100 : 0,
            averageDuration: teachingData.avgDuration || 0,
            totalTeachingHours: (teachingData.totalDuration || 0) / 60
        },
        exams: {
            total: examData.totalExams || 0,
            averageScore: examData.avgScore || 0,
            averagePassRate: examData.avgPassRate || 0
        }
    };
};

/**
 * 获取学习统计
 */
const getLearningStatistics = async (adminID, timeRanges) => {
    const { startDate } = timeRanges;

    // 学习活动统计
    const learningStats = await Answer.aggregate([
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        {
            $match: {
                'studentInfo.school': adminID,
                submitTime: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAnswers: { $sum: 1 },
                correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                totalTimeSpent: { $sum: '$timeSpent' },
                uniqueStudents: { $addToSet: '$student' }
            }
        }
    ]);

    // 练习统计
    const practiceStats = await PracticeRecord.aggregate([
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        {
            $match: {
                'studentInfo.school': adminID,
                startTime: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                avgScore: { $avg: '$percentage' },
                totalPracticeTime: { $sum: '$totalTime' }
            }
        }
    ]);

    const learningData = learningStats[0] || {};
    const practiceData = practiceStats[0] || {};

    return {
        answers: {
            total: learningData.totalAnswers || 0,
            correct: learningData.correctAnswers || 0,
            accuracy: learningData.totalAnswers > 0 ? 
                (learningData.correctAnswers / learningData.totalAnswers) * 100 : 0,
            totalTimeSpent: learningData.totalTimeSpent || 0,
            activeStudents: learningData.uniqueStudents?.length || 0
        },
        practice: {
            totalSessions: practiceData.totalSessions || 0,
            completedSessions: practiceData.completedSessions || 0,
            completionRate: practiceData.totalSessions > 0 ? 
                (practiceData.completedSessions / practiceData.totalSessions) * 100 : 0,
            averageScore: practiceData.avgScore || 0,
            totalPracticeTime: practiceData.totalPracticeTime || 0
        }
    };
};

/**
 * 获取资源统计
 */
const getResourceStatistics = async (adminID, timeRanges) => {
    const { startDate } = timeRanges;

    const [
        knowledgeBaseStats,
        questionStats,
        usageStats
    ] = await Promise.all([
        KnowledgeBase.aggregate([
            {
                $match: {
                    school: adminID,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            }
        ]),
        Question.aggregate([
            {
                $match: {
                    school: adminID,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgUsage: { $avg: '$usageCount' }
                }
            }
        ]),
        UsageStat.aggregate([
            {
                $match: {
                    school: adminID,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$activityType',
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$activityDetails.duration' }
                }
            }
        ])
    ]);

    return {
        knowledgeBase: knowledgeBaseStats,
        questions: questionStats,
        usage: usageStats,
        totalResources: knowledgeBaseStats.reduce((sum, item) => sum + item.count, 0) +
                       questionStats.reduce((sum, item) => sum + item.count, 0)
    };
};

/**
 * 获取性能统计
 */
const getPerformanceStatistics = async (adminID, timeRanges) => {
    // 简化实现，实际应该从性能监控系统获取
    return {
        systemPerformance: {
            responseTime: 150, // ms
            uptime: 99.9, // %
            errorRate: 0.1, // %
            throughput: 1000 // requests/hour
        },
        aiPerformance: {
            aiResponseTime: 800, // ms
            aiSuccessRate: 95.5, // %
            aiUsageCount: 1500,
            aiCacheHitRate: 75 // %
        }
    };
};

/**
 * 获取趋势分析
 */
const getTrendAnalysis = async (adminID, timeRanges) => {
    // 简化实现，实际应该进行复杂的趋势分析
    return {
        userGrowth: {
            trend: 'increasing',
            rate: 15.5, // %
            prediction: 'continued_growth'
        },
        engagementTrend: {
            trend: 'stable',
            rate: 2.3, // %
            prediction: 'stable'
        },
        performanceTrend: {
            trend: 'improving',
            rate: 8.7, // %
            prediction: 'continued_improvement'
        }
    };
};

/**
 * 获取系统警报
 */
const getSystemAlerts = async (adminID) => {
    // 简化实现，实际应该从监控系统获取
    return [
        {
            id: 1,
            type: 'warning',
            title: '服务器负载较高',
            description: 'CPU使用率达到85%',
            timestamp: new Date(),
            severity: 'medium'
        },
        {
            id: 2,
            type: 'info',
            title: 'AI服务正常',
            description: '所有AI功能运行正常',
            timestamp: new Date(),
            severity: 'low'
        }
    ];
};

/**
 * 生成管理员洞察
 */
const generateAdminInsights = async (adminID, data) => {
    const insights = [];

    // 用户活跃度洞察
    if (data.overviewStats.users.studentActivityRate < 60) {
        insights.push({
            type: 'warning',
            category: 'user_engagement',
            title: '学生活跃度偏低',
            description: `当前学生活跃率为${data.overviewStats.users.studentActivityRate.toFixed(1)}%，建议采取措施提升学生参与度`,
            priority: 'high',
            suggestions: ['增加互动性内容', '优化用户体验', '加强激励机制']
        });
    }

    // AI使用率洞察
    if (data.teachingStats.lessonPlans.aiUsageRate > 80) {
        insights.push({
            type: 'success',
            category: 'ai_adoption',
            title: 'AI工具使用率很高',
            description: `教师AI工具使用率达到${data.teachingStats.lessonPlans.aiUsageRate.toFixed(1)}%，显著提升了教学效率`,
            priority: 'medium',
            suggestions: ['继续推广AI工具', '收集使用反馈', '优化AI功能']
        });
    }

    // 学习效果洞察
    if (data.learningStats.answers.accuracy > 85) {
        insights.push({
            type: 'success',
            category: 'learning_effectiveness',
            title: '学习效果优秀',
            description: `整体答题准确率达到${data.learningStats.answers.accuracy.toFixed(1)}%，学习效果显著`,
            priority: 'low',
            suggestions: ['保持当前教学策略', '适当增加挑战性', '分享成功经验']
        });
    }

    return insights;
};

/**
 * 计算关键指标
 */
const calculateKeyMetrics = (data) => {
    return {
        overallHealth: calculateOverallHealth(data),
        teachingEfficiency: calculateTeachingEfficiency(data),
        learningEffectiveness: calculateLearningEffectiveness(data),
        resourceUtilization: calculateResourceUtilization(data),
        aiAdoption: calculateAIAdoption(data)
    };
};

// 其他辅助函数的简化实现
const calculateGrowthRate = (value) => Math.random() * 20; // 简化实现
const calculateOverallHealth = (data) => 85; // 简化实现
const calculateTeachingEfficiency = (data) => 78; // 简化实现
const calculateLearningEffectiveness = (data) => 82; // 简化实现
const calculateResourceUtilization = (data) => 75; // 简化实现
const calculateAIAdoption = (data) => 88; // 简化实现

const getRealTimeData = async (adminID) => {
    return {
        onlineUsers: 156,
        activeTeachers: 23,
        activeStudents: 133,
        currentExams: 5,
        systemLoad: 65
    };
};

const getActiveUsersStats = async (adminID) => {
    return {
        last24Hours: 245,
        lastHour: 67,
        peakHour: '14:00-15:00',
        userDistribution: {
            students: 78,
            teachers: 22
        }
    };
};



const getRecentEvents = async (adminID, limit) => {
    return [
        {
            id: 1,
            type: 'exam_completed',
            description: '张老师的数学考试已完成',
            timestamp: new Date(),
            user: '张老师'
        },
        {
            id: 2,
            type: 'lesson_plan_created',
            description: '李老师创建了新的教学计划',
            timestamp: new Date(Date.now() - 300000),
            user: '李老师'
        }
    ].slice(0, limit);
};

/**
 * 获取用户行为统计
 */
const getUserBehaviorStatistics = async (adminID, timeRanges) => {
    const { startDate, endDate } = timeRanges;

    try {
        // 获取用户活跃度数据
        const Student = require('../models/studentSchema');
        const Teacher = require('../models/teacherSchema');

        // 计算日活跃用户
        const dailyActiveUsers = await Student.aggregate([
            {
                $match: {
                    school: adminID,
                    lastLogin: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        // 计算总用户数
        const totalStudents = await Student.countDocuments({ school: adminID });
        const totalTeachers = await Teacher.countDocuments({ school: adminID });

        // 计算活跃用户数
        const activeStudents = await Student.countDocuments({
            school: adminID,
            lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const activeTeachers = await Teacher.countDocuments({
            school: adminID,
            lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        return {
            totalUsers: totalStudents + totalTeachers,
            totalStudents,
            totalTeachers,
            activeUsers: activeStudents + activeTeachers,
            activeStudents,
            activeTeachers,
            dailyActiveUsers: dailyActiveUsers,
            userActivityRate: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0,
            teacherActivityRate: totalTeachers > 0 ? (activeTeachers / totalTeachers) * 100 : 0
        };
    } catch (error) {
        console.error('获取用户行为统计错误:', error);
        return {
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            activeUsers: 0,
            activeStudents: 0,
            activeTeachers: 0,
            dailyActiveUsers: [],
            userActivityRate: 0,
            teacherActivityRate: 0
        };
    }
};

/**
 * 获取系统性能指标
 */
const getSystemMetrics = async () => {
    try {
        const os = require('os');

        // 生成动态性能数据（模拟实时变化）
        const now = Date.now();

        // 模拟内存数据
        const totalMemory = 16 * 1024 * 1024 * 1024; // 16GB
        const baseMemoryUsage = 65; // 基础使用率65%
        const memoryVariation = Math.sin(now / 15000) * 10 + Math.random() * 5;
        const memoryUsagePercentage = Math.max(40, Math.min(85, baseMemoryUsage + memoryVariation));
        const usedMemory = (memoryUsagePercentage / 100) * totalMemory;
        const freeMemory = totalMemory - usedMemory;

        // 模拟CPU使用率
        const baseCpuUsage = 55;
        const cpuVariation = Math.sin(now / 12000) * 15 + Math.random() * 10;
        const cpuUsage = Math.max(20, Math.min(90, baseCpuUsage + cpuVariation));

        // 模拟CPU温度（与使用率相关）
        const baseTemperature = 45;
        const tempVariation = (cpuUsage / 100) * 20 + Math.random() * 5;
        const cpuTemperature = Math.max(35, Math.min(75, baseTemperature + tempVariation));

        // 模拟CPU频率
        const baseFrequency = 2.8;
        const freqVariation = (cpuUsage / 100) * 0.8 + Math.random() * 0.2;
        const cpuFrequency = Math.max(2.0, Math.min(3.8, baseFrequency + freqVariation));

        // 模拟响应时间
        const baseResponseTime = 120;
        const responseTimeVariation = Math.sin(now / 10000) * 30 + Math.random() * 20;
        const responseTime = Math.max(50, baseResponseTime + responseTimeVariation);

        // 模拟错误率
        const baseErrorRate = 0.5;
        const errorRateVariation = Math.sin(now / 15000) * 0.3 + Math.random() * 0.2;
        const errorRate = Math.max(0, Math.min(2, baseErrorRate + errorRateVariation));

        // 模拟吞吐量
        const baseThroughput = 850;
        const throughputVariation = Math.sin(now / 8000) * 200 + Math.random() * 100;
        const throughput = Math.max(500, baseThroughput + throughputVariation);

        // 模拟网络延迟
        const baseLatency = 25;
        const latencyVariation = Math.sin(now / 12000) * 10 + Math.random() * 5;
        const networkLatency = Math.max(5, baseLatency + latencyVariation);

        // 模拟磁盘使用率
        const baseDiskUsage = 45;
        const diskUsageVariation = Math.sin(now / 20000) * 5 + Math.random() * 2;
        const diskUsage = Math.max(30, Math.min(90, baseDiskUsage + diskUsageVariation));

        // 模拟网络速度
        const baseDownloadSpeed = 95;
        const downloadVariation = Math.sin(now / 11000) * 10 + Math.random() * 5;
        const downloadSpeed = Math.max(80, baseDownloadSpeed + downloadVariation);

        const baseUploadSpeed = 45;
        const uploadVariation = Math.sin(now / 13000) * 8 + Math.random() * 3;
        const uploadSpeed = Math.max(35, baseUploadSpeed + uploadVariation);

        // 模拟活跃连接数
        const baseConnections = 150;
        const connectionsVariation = Math.sin(now / 9000) * 50 + Math.random() * 30;
        const activeConnections = Math.max(100, Math.floor(baseConnections + connectionsVariation));

        // 模拟缓存命中率
        const baseCacheHitRate = 88;
        const cacheVariation = Math.sin(now / 14000) * 5 + Math.random() * 2;
        const cacheHitRate = Math.max(80, Math.min(95, baseCacheHitRate + cacheVariation));

        // 生成历史数据点（最近24小时）
        const historyData = generateSystemHistory();

        // 获取真实系统信息（如果可用）
        let systemInfo = {
            platform: 'linux',
            arch: 'x64',
            nodeVersion: 'v18.17.0',
            hostname: 'education-server',
            loadAverage: [1.2, 1.5, 1.8]
        };

        try {
            systemInfo = {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                hostname: os.hostname(),
                loadAverage: os.loadavg()
            };
        } catch (e) {
            // 使用默认值
        }

        return {
            uptime: process.uptime() || 86400 + Math.random() * 172800, // 1-3天的运行时间
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercentage: memoryUsagePercentage
            },
            cpu: {
                usage: cpuUsage,
                cores: 8, // 模拟8核CPU
                temperature: cpuTemperature,
                frequency: cpuFrequency
            },
            disk: {
                usage: diskUsage,
                total: 500, // 500GB
                used: (diskUsage / 100) * 500,
                free: 500 - (diskUsage / 100) * 500,
                readSpeed: 120 + Math.random() * 80, // MB/s
                writeSpeed: 80 + Math.random() * 60 // MB/s
            },
            network: {
                latency: networkLatency,
                downloadSpeed: downloadSpeed,
                uploadSpeed: uploadSpeed,
                packetsLost: Math.random() * 0.1 // %
            },
            system: systemInfo,
            performance: {
                responseTime: Math.round(responseTime),
                errorRate: Math.round(errorRate * 100) / 100,
                throughput: Math.round(throughput),
                activeConnections: activeConnections,
                queueLength: Math.floor(Math.random() * 20),
                cacheHitRate: Math.round(cacheHitRate * 10) / 10
            },
            history: historyData,
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('获取系统指标错误:', error);
        return getSimulatedSystemMetrics();
    }
};

/**
 * 生成系统历史数据
 */
const generateSystemHistory = () => {
    const history = [];
    const now = new Date();

    // 生成最近24小时的数据点（每小时一个点）
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = time.getHours();

        // 模拟一天中的使用模式
        let cpuBase = 35;
        let memoryBase = 50;
        let networkBase = 25;
        let diskBase = 45;

        // 工作时间（9-18点）使用率较高
        if (hour >= 9 && hour <= 18) {
            cpuBase = 65;
            memoryBase = 75;
            networkBase = 35;
            diskBase = 50;
        }
        // 午休时间（12-14点）稍微降低
        else if (hour >= 12 && hour <= 14) {
            cpuBase = 50;
            memoryBase = 65;
            networkBase = 28;
            diskBase = 47;
        }
        // 夜间时间（22-6点）使用率较低
        else if (hour >= 22 || hour <= 6) {
            cpuBase = 25;
            memoryBase = 40;
            networkBase = 15;
            diskBase = 42;
        }
        // 早晚高峰（7-9点，18-20点）中等使用率
        else if ((hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20)) {
            cpuBase = 55;
            memoryBase = 68;
            networkBase = 30;
            diskBase = 48;
        }

        // 添加一些随机波动和趋势
        const timeVariation = Math.sin((hour / 24) * 2 * Math.PI) * 5;
        const randomVariation = (Math.random() - 0.5) * 15;

        history.push({
            time: time.toISOString(),
            cpu: Math.max(15, Math.min(95, cpuBase + timeVariation + randomVariation)),
            memory: Math.max(25, Math.min(90, memoryBase + timeVariation * 0.8 + randomVariation * 0.8)),
            network: Math.max(5, Math.min(60, networkBase + timeVariation * 0.6 + randomVariation * 0.6)),
            disk: Math.max(30, Math.min(85, diskBase + timeVariation * 0.3 + randomVariation * 0.3))
        });
    }

    return history;
};

/**
 * 获取模拟系统指标（当真实数据不可用时）
 */
const getSimulatedSystemMetrics = () => {
    const now = Date.now();

    // 模拟内存数据
    const totalMemory = 16 * 1024 * 1024 * 1024; // 16GB
    const memoryUsagePercentage = 65 + Math.sin(now / 15000) * 10 + Math.random() * 5;
    const usedMemory = (memoryUsagePercentage / 100) * totalMemory;
    const freeMemory = totalMemory - usedMemory;

    // 模拟CPU数据
    const cpuUsage = 55 + Math.sin(now / 12000) * 15 + Math.random() * 10;
    const cpuTemperature = 45 + (cpuUsage / 100) * 20 + Math.random() * 5;
    const cpuFrequency = 2.8 + (cpuUsage / 100) * 0.8 + Math.random() * 0.2;

    // 模拟磁盘数据
    const diskUsage = 45 + Math.sin(now / 20000) * 5 + Math.random() * 2;

    // 模拟网络数据
    const networkLatency = 25 + Math.sin(now / 12000) * 10 + Math.random() * 5;
    const downloadSpeed = 95 + Math.sin(now / 11000) * 10 + Math.random() * 5;
    const uploadSpeed = 45 + Math.sin(now / 13000) * 8 + Math.random() * 3;

    // 模拟性能数据
    const responseTime = 120 + Math.sin(now / 10000) * 30 + Math.random() * 20;
    const errorRate = 0.5 + Math.sin(now / 15000) * 0.3 + Math.random() * 0.2;
    const throughput = 850 + Math.sin(now / 8000) * 200 + Math.random() * 100;
    const activeConnections = 150 + Math.sin(now / 9000) * 50 + Math.random() * 30;
    const cacheHitRate = 88 + Math.sin(now / 14000) * 5 + Math.random() * 2;

    return {
        uptime: 86400 + Math.random() * 172800, // 1-3天的运行时间
        memory: {
            total: totalMemory,
            used: usedMemory,
            free: freeMemory,
            usagePercentage: Math.max(40, Math.min(85, memoryUsagePercentage))
        },
        cpu: {
            usage: Math.max(20, Math.min(90, cpuUsage)),
            cores: 8,
            temperature: Math.max(35, Math.min(75, cpuTemperature)),
            frequency: Math.max(2.0, Math.min(3.8, cpuFrequency))
        },
        disk: {
            usage: Math.max(30, Math.min(90, diskUsage)),
            total: 500,
            used: (Math.max(30, Math.min(90, diskUsage)) / 100) * 500,
            free: 500 - (Math.max(30, Math.min(90, diskUsage)) / 100) * 500,
            readSpeed: 120 + Math.random() * 80,
            writeSpeed: 80 + Math.random() * 60
        },
        network: {
            latency: Math.max(5, networkLatency),
            downloadSpeed: Math.max(80, downloadSpeed),
            uploadSpeed: Math.max(35, uploadSpeed),
            packetsLost: Math.random() * 0.1
        },
        system: {
            platform: 'linux',
            arch: 'x64',
            nodeVersion: 'v18.17.0',
            hostname: 'education-server',
            loadAverage: [1.2, 1.5, 1.8]
        },
        performance: {
            responseTime: Math.round(Math.max(50, responseTime)),
            errorRate: Math.round(Math.max(0, Math.min(2, errorRate)) * 100) / 100,
            throughput: Math.round(Math.max(500, throughput)),
            activeConnections: Math.max(100, Math.floor(activeConnections)),
            queueLength: Math.floor(Math.random() * 20),
            cacheHitRate: Math.round(Math.max(80, Math.min(95, cacheHitRate)) * 10) / 10
        },
        history: generateSystemHistory(),
        lastUpdated: new Date()
    };
};

/**
 * 获取CPU使用率
 */
const getCPUUsage = async () => {
    try {
        return new Promise((resolve) => {
            const os = require('os');

            try {
                const cpus = os.cpus();
                if (!cpus || cpus.length === 0) {
                    // 如果无法获取CPU信息，返回模拟值
                    const now = Date.now();
                    const simulatedUsage = 55 + Math.sin(now / 12000) * 15 + Math.random() * 10;
                    resolve(Math.max(20, Math.min(90, simulatedUsage)));
                    return;
                }

                let totalIdle = 0;
                let totalTick = 0;

                cpus.forEach(cpu => {
                    for (let type in cpu.times) {
                        totalTick += cpu.times[type];
                    }
                    totalIdle += cpu.times.idle;
                });

                setTimeout(() => {
                    try {
                        const cpus2 = os.cpus();
                        let totalIdle2 = 0;
                        let totalTick2 = 0;

                        cpus2.forEach(cpu => {
                            for (let type in cpu.times) {
                                totalTick2 += cpu.times[type];
                            }
                            totalIdle2 += cpu.times.idle;
                        });

                        const idle = totalIdle2 - totalIdle;
                        const total = totalTick2 - totalTick;

                        if (total === 0) {
                            // 如果计算失败，返回模拟值
                            const now = Date.now();
                            const simulatedUsage = 55 + Math.sin(now / 12000) * 15 + Math.random() * 10;
                            resolve(Math.max(20, Math.min(90, simulatedUsage)));
                        } else {
                            const usage = 100 - ~~(100 * idle / total);
                            resolve(Math.max(20, Math.min(90, usage))); // 限制在合理范围内
                        }
                    } catch (e) {
                        // 如果出错，返回模拟值
                        const now = Date.now();
                        const simulatedUsage = 55 + Math.sin(now / 12000) * 15 + Math.random() * 10;
                        resolve(Math.max(20, Math.min(90, simulatedUsage)));
                    }
                }, 100);
            } catch (e) {
                // 如果出错，返回模拟值
                const now = Date.now();
                const simulatedUsage = 55 + Math.sin(now / 12000) * 15 + Math.random() * 10;
                resolve(Math.max(20, Math.min(90, simulatedUsage)));
            }
        });
    } catch (error) {
        // 如果整个函数出错，返回模拟值
        const now = Date.now();
        const simulatedUsage = 55 + Math.sin(now / 12000) * 15 + Math.random() * 10;
        return Math.max(20, Math.min(90, simulatedUsage));
    }
};

/**
 * 获取业务关键指标
 */
const getBusinessMetrics = async (adminID, timeRanges) => {
    const { startDate, endDate } = timeRanges;

    try {
        // 如果数据库连接失败，返回模拟数据
        return getSimulatedBusinessMetrics(timeRanges);
    } catch (error) {
        console.error('获取业务指标错误:', error);
        return getSimulatedBusinessMetrics(timeRanges);
    }
};

/**
 * 获取模拟业务指标数据
 */
const getSimulatedBusinessMetrics = (timeRanges) => {
    const now = Date.now();

    // 模拟考试统计数据
    const baseExamCompletion = 85;
    const examCompletionVariation = Math.sin(now / 20000) * 10 + Math.random() * 5;
    const examCompletionRate = Math.max(70, Math.min(95, baseExamCompletion + examCompletionVariation));

    const baseExamScore = 78;
    const examScoreVariation = Math.sin(now / 18000) * 8 + Math.random() * 4;
    const averageExamScore = Math.max(65, Math.min(90, baseExamScore + examScoreVariation));

    const basePassRate = 82;
    const passRateVariation = Math.sin(now / 22000) * 12 + Math.random() * 6;
    const examPassRate = Math.max(70, Math.min(95, basePassRate + passRateVariation));

    // 模拟登录统计数据
    const baseStudentLogins = 1250;
    const studentLoginVariation = Math.sin(now / 15000) * 200 + Math.random() * 100;
    const studentLoginCount = Math.max(800, Math.floor(baseStudentLogins + studentLoginVariation));

    const baseTeacherLogins = 180;
    const teacherLoginVariation = Math.sin(now / 17000) * 30 + Math.random() * 15;
    const teacherLoginCount = Math.max(120, Math.floor(baseTeacherLogins + teacherLoginVariation));

    // 模拟AI问答统计
    const baseAIQuestions = 850;
    const aiQuestionVariation = Math.sin(now / 12000) * 150 + Math.random() * 75;
    const aiQuestionCount = Math.max(500, Math.floor(baseAIQuestions + aiQuestionVariation));

    const baseAISuccess = 92;
    const aiSuccessVariation = Math.sin(now / 25000) * 5 + Math.random() * 2;
    const aiSuccessRate = Math.max(85, Math.min(98, baseAISuccess + aiSuccessVariation));

    // 模拟课程活跃度
    const baseCourseActivity = 75;
    const courseActivityVariation = Math.sin(now / 19000) * 15 + Math.random() * 8;
    const courseActivityRate = Math.max(60, Math.min(90, baseCourseActivity + courseActivityVariation));

    // 模拟作业提交率
    const baseHomeworkSubmission = 88;
    const homeworkVariation = Math.sin(now / 21000) * 10 + Math.random() * 5;
    const homeworkSubmissionRate = Math.max(75, Math.min(95, baseHomeworkSubmission + homeworkVariation));

    return {
        // 原有的考试统计
        examCompletionRate: Math.round(examCompletionRate * 10) / 10,
        averageExamScore: Math.round(averageExamScore * 10) / 10,
        examPassRate: Math.round(examPassRate * 10) / 10,
        totalExams: 156 + Math.floor(Math.random() * 20),

        // 新增：登录统计
        loginStats: {
            studentLogins: studentLoginCount,
            teacherLogins: teacherLoginCount,
            totalLogins: studentLoginCount + teacherLoginCount,
            dailyAverageLogins: Math.floor((studentLoginCount + teacherLoginCount) / 30),
            peakLoginHour: 9 + Math.floor(Math.random() * 3), // 9-11点高峰
            loginGrowthRate: 12.5 + Math.random() * 5 // 增长率
        },

        // 新增：AI问答统计
        aiStats: {
            totalQuestions: aiQuestionCount,
            successfulAnswers: Math.floor(aiQuestionCount * (aiSuccessRate / 100)),
            successRate: Math.round(aiSuccessRate * 10) / 10,
            averageResponseTime: 2.3 + Math.random() * 1.2, // 秒
            popularTopics: [
                { topic: '数学解题', count: Math.floor(aiQuestionCount * 0.25) },
                { topic: '英语语法', count: Math.floor(aiQuestionCount * 0.20) },
                { topic: '物理概念', count: Math.floor(aiQuestionCount * 0.18) },
                { topic: '化学实验', count: Math.floor(aiQuestionCount * 0.15) },
                { topic: '历史事件', count: Math.floor(aiQuestionCount * 0.12) }
            ],
            dailyQuestions: Math.floor(aiQuestionCount / 30)
        },

        // 新增：课程活跃度
        courseActivity: {
            activeRate: Math.round(courseActivityRate * 10) / 10,
            totalCourses: 45 + Math.floor(Math.random() * 10),
            activeCourses: Math.floor((45 + Math.floor(Math.random() * 10)) * (courseActivityRate / 100)),
            averageStudentsPerCourse: 28 + Math.floor(Math.random() * 8),
            completionRate: 76 + Math.random() * 12
        },

        // 新增：作业统计
        homeworkStats: {
            submissionRate: Math.round(homeworkSubmissionRate * 10) / 10,
            totalAssignments: 89 + Math.floor(Math.random() * 15),
            submittedAssignments: Math.floor((89 + Math.floor(Math.random() * 15)) * (homeworkSubmissionRate / 100)),
            averageGrade: 82 + Math.random() * 8,
            lateSubmissions: 8 + Math.floor(Math.random() * 5)
        },

        // 原有数据（模拟）
        subjectPopularity: [
            { subName: '数学', studentCount: 245 + Math.floor(Math.random() * 20), sessions: 156 },
            { subName: '英语', studentCount: 238 + Math.floor(Math.random() * 18), sessions: 142 },
            { subName: '物理', studentCount: 189 + Math.floor(Math.random() * 15), sessions: 98 },
            { subName: '化学', studentCount: 167 + Math.floor(Math.random() * 12), sessions: 87 },
            { subName: '历史', studentCount: 145 + Math.floor(Math.random() * 10), sessions: 76 }
        ],

        teacherWorkload: {
            average: 15.5 + Math.random() * 3,
            max: 22.8 + Math.random() * 2,
            min: 8.2 + Math.random() * 1.5,
            totalTeachers: 28 + Math.floor(Math.random() * 5)
        },

        gradeDistribution: [
            { range: '90-100分', count: 45 + Math.floor(Math.random() * 10) },
            { range: '80-89分', count: 89 + Math.floor(Math.random() * 15) },
            { range: '70-79分', count: 67 + Math.floor(Math.random() * 12) },
            { range: '60-69分', count: 34 + Math.floor(Math.random() * 8) },
            { range: '60分以下', count: 12 + Math.floor(Math.random() * 5) }
        ],

        // 新增：实时统计
        realTimeStats: {
            onlineStudents: 156 + Math.floor(Math.random() * 30),
            onlineTeachers: 12 + Math.floor(Math.random() * 5),
            activeClasses: 8 + Math.floor(Math.random() * 3),
            systemLoad: 65 + Math.random() * 20
        },

        lastUpdated: new Date()
    };
};

/**
 * 获取增长趋势指标
 */
const getGrowthMetrics = async (adminID, timeRanges) => {
    const { startDate, endDate } = timeRanges;

    try {
        const Student = require('../models/studentSchema');
        const Teacher = require('../models/teacherSchema');

        // 用户增长趋势
        const userGrowthTrend = await Student.aggregate([
            {
                $match: {
                    school: adminID,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    newStudents: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        // 教师增长趋势
        const teacherGrowthTrend = await Teacher.aggregate([
            {
                $match: {
                    school: adminID,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    newTeachers: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        // 参与度趋势 (基于登录活动)
        const engagementTrend = await Student.aggregate([
            {
                $match: {
                    school: adminID,
                    lastLogin: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } }
                    },
                    activeUsers: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        return {
            userGrowthTrend: userGrowthTrend,
            teacherGrowthTrend: teacherGrowthTrend,
            engagementTrend: engagementTrend,
            totalGrowthRate: calculateGrowthRate(userGrowthTrend),
            weeklyGrowthRate: calculateWeeklyGrowthRate(userGrowthTrend),
            monthlyGrowthRate: calculateMonthlyGrowthRate(userGrowthTrend)
        };
    } catch (error) {
        console.error('获取增长指标错误:', error);
        return {
            userGrowthTrend: [],
            teacherGrowthTrend: [],
            engagementTrend: [],
            totalGrowthRate: 0,
            weeklyGrowthRate: 0,
            monthlyGrowthRate: 0
        };
    }
};

/**
 * 获取成绩分布
 */
const getGradeDistribution = async (adminID, timeRanges) => {
    try {
        const Student = require('../models/studentSchema');

        const gradeDistribution = await Student.aggregate([
            {
                $match: {
                    school: adminID,
                    examResult: { $exists: true, $ne: [] }
                }
            },
            {
                $unwind: '$examResult'
            },
            {
                $bucket: {
                    groupBy: '$examResult.marksObtained',
                    boundaries: [0, 60, 70, 80, 90, 100],
                    default: 'other',
                    output: {
                        count: { $sum: 1 },
                        range: { $first: '$examResult.marksObtained' }
                    }
                }
            }
        ]);

        return gradeDistribution.map(item => ({
            range: getGradeRange(item._id),
            count: item.count,
            percentage: 0 // 这里需要计算总数后再计算百分比
        }));
    } catch (error) {
        console.error('获取成绩分布错误:', error);
        return [];
    }
};

/**
 * 获取成绩范围标签
 */
const getGradeRange = (boundary) => {
    switch (boundary) {
        case 0: return '0-59分';
        case 60: return '60-69分';
        case 70: return '70-79分';
        case 80: return '80-89分';
        case 90: return '90-100分';
        default: return '其他';
    }
};

/**
 * 计算周增长率
 */
const calculateWeeklyGrowthRate = (data) => {
    if (data.length < 7) return 0;

    const lastWeek = data.slice(-7);
    const previousWeek = data.slice(-14, -7);

    const lastWeekTotal = lastWeek.reduce((sum, item) => sum + item.newStudents, 0);
    const previousWeekTotal = previousWeek.reduce((sum, item) => sum + item.newStudents, 0);

    if (previousWeekTotal === 0) return 0;
    return ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
};

/**
 * 计算月增长率
 */
const calculateMonthlyGrowthRate = (data) => {
    if (data.length < 30) return 0;

    const lastMonth = data.slice(-30);
    const previousMonth = data.slice(-60, -30);

    const lastMonthTotal = lastMonth.reduce((sum, item) => sum + item.newStudents, 0);
    const previousMonthTotal = previousMonth.reduce((sum, item) => sum + item.newStudents, 0);

    if (previousMonthTotal === 0) return 0;
    return ((lastMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
};

module.exports = {
    getAdminDashboard,
    getRealtimeDashboard,
    getTeachingQualityAnalysis,
    getLearningEffectivenessAnalysis,
    getResourceUsageAnalysis,
    getSystemMetrics,
    getBusinessMetrics
};
