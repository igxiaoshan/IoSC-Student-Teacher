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

        // 并行获取各种统计数据
        const [
            overviewStats,
            teachingStats,
            learningStats,
            resourceStats,
            performanceStats,
            trendAnalysis,
            alerts
        ] = await Promise.all([
            getOverviewStatistics(adminID, timeRanges),
            getTeachingStatistics(adminID, timeRanges),
            getLearningStatistics(adminID, timeRanges),
            getResourceStatistics(adminID, timeRanges),
            getPerformanceStatistics(adminID, timeRanges),
            getTrendAnalysis(adminID, timeRanges),
            getSystemAlerts(adminID)
        ]);

        // 生成AI洞察
        const aiInsights = await generateAdminInsights(adminID, {
            overviewStats,
            teachingStats,
            learningStats,
            performanceStats
        });

        // 计算关键指标
        const keyMetrics = calculateKeyMetrics({
            overviewStats,
            teachingStats,
            learningStats,
            performanceStats
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
            trends: trendAnalysis,
            keyMetrics: keyMetrics,
            insights: aiInsights,
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

        // AI分析教学质量
        const aiAnalysis = await analyzeTeachingQuality(qualityData);

        // 生成改进建议
        const improvements = await generateImprovementSuggestions(qualityData, aiAnalysis);

        // 对比分析
        const comparison = await generateQualityComparison(adminID, qualityData, period);

        res.json({
            adminID,
            period,
            subject,
            teacher,
            qualityData: qualityData,
            analysis: aiAnalysis,
            improvements: improvements,
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

        // AI分析学习效果
        const aiAnalysis = await analyzeLearningEffectiveness(effectivenessData);

        // 识别学习模式
        const learningPatterns = await identifyLearningPatterns(effectivenessData);

        // 生成优化建议
        const optimizations = await generateLearningOptimizations(effectivenessData, aiAnalysis);

        res.json({
            adminID,
            period,
            subject,
            grade,
            effectivenessData: effectivenessData,
            analysis: aiAnalysis,
            patterns: learningPatterns,
            optimizations: optimizations,
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

const getSystemMetrics = async (adminID) => {
    return {
        cpuUsage: 65,
        memoryUsage: 72,
        diskUsage: 45,
        networkLatency: 25
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

module.exports = {
    getAdminDashboard,
    getRealtimeDashboard,
    getTeachingQualityAnalysis,
    getLearningEffectivenessAnalysis,
    getResourceUsageAnalysis
};
