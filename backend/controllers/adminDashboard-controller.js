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

        // 获取系统基本信息
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        // 获取CPU使用率
        const cpuUsage = await getCPUUsage();

        // 生成动态性能数据（模拟实时变化）
        const now = Date.now();
        const baseResponseTime = 120;
        const responseTimeVariation = Math.sin(now / 10000) * 30 + Math.random() * 20;
        const responseTime = Math.max(50, baseResponseTime + responseTimeVariation);

        const baseErrorRate = 0.5;
        const errorRateVariation = Math.sin(now / 15000) * 0.3 + Math.random() * 0.2;
        const errorRate = Math.max(0, baseErrorRate + errorRateVariation);

        const baseThroughput = 850;
        const throughputVariation = Math.sin(now / 8000) * 200 + Math.random() * 100;
        const throughput = Math.max(500, baseThroughput + throughputVariation);

        // 生成网络延迟数据
        const baseLatency = 25;
        const latencyVariation = Math.sin(now / 12000) * 10 + Math.random() * 5;
        const networkLatency = Math.max(5, baseLatency + latencyVariation);

        // 生成磁盘使用率
        const baseDiskUsage = 45;
        const diskUsageVariation = Math.sin(now / 20000) * 5 + Math.random() * 2;
        const diskUsage = Math.max(30, Math.min(90, baseDiskUsage + diskUsageVariation));

        // 生成历史数据点（最近24小时）
        const historyData = generateSystemHistory();

        return {
            uptime: process.uptime(),
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercentage: (usedMemory / totalMemory) * 100
            },
            cpu: {
                usage: cpuUsage,
                cores: os.cpus().length,
                temperature: 45 + Math.random() * 20, // 模拟CPU温度
                frequency: 2.4 + Math.random() * 1.2 // 模拟CPU频率 (GHz)
            },
            disk: {
                usage: diskUsage,
                total: 500, // GB
                used: (diskUsage / 100) * 500,
                free: 500 - (diskUsage / 100) * 500,
                readSpeed: 120 + Math.random() * 80, // MB/s
                writeSpeed: 80 + Math.random() * 60 // MB/s
            },
            network: {
                latency: networkLatency,
                downloadSpeed: 95 + Math.random() * 10, // Mbps
                uploadSpeed: 45 + Math.random() * 15, // Mbps
                packetsLost: Math.random() * 0.1 // %
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                hostname: os.hostname(),
                loadAverage: os.loadavg()
            },
            performance: {
                responseTime: Math.round(responseTime),
                errorRate: Math.round(errorRate * 100) / 100,
                throughput: Math.round(throughput),
                activeConnections: 150 + Math.floor(Math.random() * 100),
                queueLength: Math.floor(Math.random() * 20),
                cacheHitRate: 85 + Math.random() * 10
            },
            history: historyData,
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('获取系统指标错误:', error);
        return getDefaultSystemMetrics();
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
        let cpuBase = 30;
        let memoryBase = 45;

        // 工作时间（9-18点）使用率较高
        if (hour >= 9 && hour <= 18) {
            cpuBase = 60;
            memoryBase = 70;
        }
        // 夜间时间使用率较低
        else if (hour >= 22 || hour <= 6) {
            cpuBase = 20;
            memoryBase = 35;
        }

        history.push({
            time: time.toISOString(),
            cpu: Math.max(10, Math.min(95, cpuBase + (Math.random() - 0.5) * 20)),
            memory: Math.max(20, Math.min(90, memoryBase + (Math.random() - 0.5) * 15)),
            network: Math.max(5, 25 + (Math.random() - 0.5) * 10),
            disk: Math.max(30, 45 + (Math.random() - 0.5) * 8)
        });
    }

    return history;
};

/**
 * 获取默认系统指标
 */
const getDefaultSystemMetrics = () => {
    return {
        uptime: 0,
        memory: { total: 0, used: 0, free: 0, usagePercentage: 0 },
        cpu: { usage: 0, cores: 0, temperature: 0, frequency: 0 },
        disk: { usage: 0, total: 0, used: 0, free: 0, readSpeed: 0, writeSpeed: 0 },
        network: { latency: 0, downloadSpeed: 0, uploadSpeed: 0, packetsLost: 0 },
        system: { platform: 'unknown', arch: 'unknown', nodeVersion: 'unknown', hostname: 'unknown', loadAverage: [0, 0, 0] },
        performance: { responseTime: 0, errorRate: 0, throughput: 0, activeConnections: 0, queueLength: 0, cacheHitRate: 0 },
        history: [],
        lastUpdated: new Date()
    };
};

/**
 * 获取CPU使用率
 */
const getCPUUsage = async () => {
    return new Promise((resolve) => {
        const os = require('os');
        const cpus = os.cpus();

        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        setTimeout(() => {
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
            const usage = 100 - ~~(100 * idle / total);

            resolve(Math.max(10, Math.min(95, usage))); // 限制在合理范围内
        }, 100);
    });
};

/**
 * 获取业务关键指标
 */
const getBusinessMetrics = async (adminID, timeRanges) => {
    const { startDate, endDate } = timeRanges;

    try {
        const Student = require('../models/studentSchema');
        const Teacher = require('../models/teacherSchema');
        const Subject = require('../models/subjectSchema');

        // 考试完成率统计
        const examStats = await Student.aggregate([
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
                $match: {
                    'examResult.date': { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalExams: { $sum: 1 },
                    completedExams: {
                        $sum: {
                            $cond: [{ $ne: ['$examResult.marksObtained', null] }, 1, 0]
                        }
                    },
                    averageScore: { $avg: '$examResult.marksObtained' },
                    passCount: {
                        $sum: {
                            $cond: [{ $gte: ['$examResult.marksObtained', 60] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // 科目受欢迎程度
        const subjectPopularity = await Subject.aggregate([
            {
                $match: { school: adminID }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'sclassName',
                    foreignField: 'sclassName',
                    as: 'students'
                }
            },
            {
                $project: {
                    subName: 1,
                    studentCount: { $size: '$students' },
                    sessions: { $ifNull: ['$sessions', 0] }
                }
            },
            {
                $sort: { studentCount: -1 }
            }
        ]);

        // 教师工作负载
        const teacherWorkload = await Teacher.aggregate([
            {
                $match: { school: adminID }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'teachSclass',
                    foreignField: 'sclassName',
                    as: 'students'
                }
            },
            {
                $project: {
                    name: 1,
                    teachSubject: 1,
                    studentCount: { $size: '$students' },
                    workloadScore: {
                        $multiply: [{ $size: '$students' }, 1.5]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    averageWorkload: { $avg: '$workloadScore' },
                    maxWorkload: { $max: '$workloadScore' },
                    minWorkload: { $min: '$workloadScore' },
                    totalTeachers: { $sum: 1 }
                }
            }
        ]);

        const examData = examStats[0] || {};
        const workloadData = teacherWorkload[0] || {};

        return {
            examCompletionRate: examData.totalExams > 0 ?
                (examData.completedExams / examData.totalExams) * 100 : 0,
            averageExamScore: examData.averageScore || 0,
            examPassRate: examData.completedExams > 0 ?
                (examData.passCount / examData.completedExams) * 100 : 0,
            totalExams: examData.totalExams || 0,
            subjectPopularity: subjectPopularity.slice(0, 5),
            teacherWorkload: {
                average: workloadData.averageWorkload || 0,
                max: workloadData.maxWorkload || 0,
                min: workloadData.minWorkload || 0,
                totalTeachers: workloadData.totalTeachers || 0
            },
            gradeDistribution: await getGradeDistribution(adminID, timeRanges)
        };
    } catch (error) {
        console.error('获取业务指标错误:', error);
        return {
            examCompletionRate: 0,
            averageExamScore: 0,
            examPassRate: 0,
            totalExams: 0,
            subjectPopularity: [],
            teacherWorkload: { average: 0, max: 0, min: 0, totalTeachers: 0 },
            gradeDistribution: []
        };
    }
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
    getResourceUsageAnalysis
};
