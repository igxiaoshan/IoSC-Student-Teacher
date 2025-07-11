const KnowledgeBase = require('../models/knowledgeBaseSchema');
const Question = require('../models/questionSchema');
const LessonPlan = require('../models/lessonPlanSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const UsageStat = require('../models/usageStatSchema');
const aiService = require('../services/aiService');

/**
 * 获取资源管理概览
 */
const getResourceOverview = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { category = 'all', period = 'month' } = req.query;

        // 计算时间范围
        const timeRange = calculateTimeRange(period);

        // 获取资源统计
        const resourceStats = await getResourceStatistics(adminID, timeRange, category);

        // 获取使用情况分析
        const usageAnalysis = await getUsageAnalysis(adminID, timeRange, category);

        // 获取资源质量评估
        const qualityAssessment = await getResourceQualityAssessment(adminID, category);

        // 获取资源分布
        const distribution = await getResourceDistribution(adminID, category);

        // 生成优化建议
        const optimizations = await generateResourceOptimizations(resourceStats, usageAnalysis, qualityAssessment);

        res.json({
            adminID,
            category,
            period,
            overview: resourceStats,
            usage: usageAnalysis,
            quality: qualityAssessment,
            distribution: distribution,
            optimizations: optimizations,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取资源管理概览错误:', error);
        res.status(500).json({
            message: '获取资源管理概览失败',
            error: error.message
        });
    }
};

/**
 * 获取资源使用详情
 */
const getResourceUsageDetail = async (req, res) => {
    try {
        const { adminID, resourceType } = req.params;
        const { period = 'month', sortBy = 'usage' } = req.query;

        const timeRange = calculateTimeRange(period);

        // 获取详细使用数据
        const usageDetails = await getDetailedUsageData(adminID, resourceType, timeRange, sortBy);

        // 获取热门资源
        const popularResources = await getPopularResources(adminID, resourceType, timeRange);

        // 获取低使用率资源
        const underutilizedResources = await getUnderutilizedResources(adminID, resourceType, timeRange);

        // 分析使用模式
        const usagePatterns = await analyzeUsagePatterns(adminID, resourceType, timeRange);

        res.json({
            adminID,
            resourceType,
            period,
            sortBy,
            details: usageDetails,
            popular: popularResources,
            underutilized: underutilizedResources,
            patterns: usagePatterns,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取资源使用详情错误:', error);
        res.status(500).json({
            message: '获取资源使用详情失败',
            error: error.message
        });
    }
};

/**
 * 智能资源分配建议
 */
const getResourceAllocationSuggestions = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { targetType, targetId, requirements } = req.body;

        // 获取目标需求分析
        const needsAnalysis = await analyzeResourceNeeds(targetType, targetId, requirements);

        // 获取可用资源
        const availableResources = await getAvailableResources(adminID, needsAnalysis);

        // AI生成分配建议
        const allocationSuggestions = await generateAllocationSuggestions(needsAnalysis, availableResources);

        // 计算分配效果预测
        const effectPrediction = await predictAllocationEffect(allocationSuggestions, needsAnalysis);

        res.json({
            targetType,
            targetId,
            needsAnalysis: needsAnalysis,
            availableResources: availableResources,
            suggestions: allocationSuggestions,
            prediction: effectPrediction,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取资源分配建议错误:', error);
        res.status(500).json({
            message: '获取资源分配建议失败',
            error: error.message
        });
    }
};

/**
 * 资源质量评估
 */
const evaluateResourceQuality = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { resourceIds, evaluationType = 'comprehensive' } = req.body;

        // 获取资源信息
        const resources = await getResourcesForEvaluation(resourceIds);

        // 进行质量评估
        const evaluations = await Promise.all(
            resources.map(async (resource) => {
                const evaluation = await evaluateIndividualResource(resource, evaluationType);
                return {
                    resourceId: resource._id,
                    resourceType: resource.type || resource.constructor.modelName,
                    title: resource.title,
                    evaluation: evaluation
                };
            })
        );

        // 生成质量报告
        const qualityReport = await generateQualityReport(evaluations);

        // 生成改进建议
        const improvements = await generateQualityImprovements(evaluations);

        res.json({
            adminID,
            evaluationType,
            evaluations: evaluations,
            report: qualityReport,
            improvements: improvements,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('资源质量评估错误:', error);
        res.status(500).json({
            message: '资源质量评估失败',
            error: error.message
        });
    }
};

/**
 * 资源需求预测
 */
const predictResourceDemand = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { timeHorizon = '3months', resourceType = 'all' } = req.query;

        // 获取历史使用数据
        const historicalData = await getHistoricalUsageData(adminID, resourceType);

        // 获取当前趋势
        const currentTrends = await getCurrentUsageTrends(adminID, resourceType);

        // AI预测未来需求
        const demandPrediction = await predictFutureDemand(historicalData, currentTrends, timeHorizon);

        // 生成资源规划建议
        const planningRecommendations = await generateResourcePlanningRecommendations(demandPrediction);

        res.json({
            adminID,
            timeHorizon,
            resourceType,
            historicalData: historicalData,
            currentTrends: currentTrends,
            prediction: demandPrediction,
            recommendations: planningRecommendations,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('资源需求预测错误:', error);
        res.status(500).json({
            message: '资源需求预测失败',
            error: error.message
        });
    }
};

/**
 * 资源共享分析
 */
const analyzeResourceSharing = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { scope = 'school', resourceType = 'all' } = req.query;

        // 获取共享统计
        const sharingStats = await getResourceSharingStats(adminID, scope, resourceType);

        // 分析共享效果
        const sharingEffectiveness = await analyzeSharingEffectiveness(sharingStats);

        // 识别共享机会
        const sharingOpportunities = await identifySharingOpportunities(adminID, resourceType);

        // 生成共享优化建议
        const sharingOptimizations = await generateSharingOptimizations(sharingStats, sharingOpportunities);

        res.json({
            adminID,
            scope,
            resourceType,
            stats: sharingStats,
            effectiveness: sharingEffectiveness,
            opportunities: sharingOpportunities,
            optimizations: sharingOptimizations,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('资源共享分析错误:', error);
        res.status(500).json({
            message: '资源共享分析失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 计算时间范围
 */
const calculateTimeRange = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'quarter':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
};

/**
 * 获取资源统计
 */
const getResourceStatistics = async (adminID, timeRange, category) => {
    const { startDate } = timeRange;

    const [
        knowledgeBaseStats,
        questionStats,
        lessonPlanStats
    ] = await Promise.all([
        KnowledgeBase.aggregate([
            {
                $match: {
                    school: adminID,
                    ...(category !== 'all' && { type: category }),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    avgRating: { $avg: '$rating' }
                }
            }
        ]),
        Question.aggregate([
            {
                $match: {
                    school: adminID,
                    ...(category !== 'all' && { type: category }),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgUsage: { $avg: '$usageCount' },
                    avgRating: { $avg: '$averageScore' }
                }
            }
        ]),
        LessonPlan.aggregate([
            {
                $match: {
                    school: adminID,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$duration' }
                }
            }
        ])
    ]);

    return {
        knowledgeBase: knowledgeBaseStats,
        questions: questionStats,
        lessonPlans: lessonPlanStats,
        summary: {
            totalResources: knowledgeBaseStats.reduce((sum, item) => sum + item.count, 0) +
                           questionStats.reduce((sum, item) => sum + item.count, 0) +
                           lessonPlanStats.reduce((sum, item) => sum + item.count, 0),
            totalSize: knowledgeBaseStats.reduce((sum, item) => sum + (item.totalSize || 0), 0)
        }
    };
};

/**
 * 获取使用情况分析
 */
const getUsageAnalysis = async (adminID, timeRange, category) => {
    const { startDate } = timeRange;

    const usageStats = await UsageStat.aggregate([
        {
            $match: {
                school: adminID,
                date: { $gte: startDate },
                ...(category !== 'all' && { 'activityDetails.resourceType': category })
            }
        },
        {
            $group: {
                _id: {
                    resourceType: '$activityDetails.resourceType',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
                },
                usageCount: { $sum: 1 },
                totalDuration: { $sum: '$activityDetails.duration' },
                uniqueUsers: { $addToSet: '$user' }
            }
        },
        {
            $group: {
                _id: '$_id.resourceType',
                dailyUsage: {
                    $push: {
                        date: '$_id.date',
                        count: '$usageCount',
                        duration: '$totalDuration',
                        users: { $size: '$uniqueUsers' }
                    }
                },
                totalUsage: { $sum: '$usageCount' },
                avgDailyUsers: { $avg: { $size: '$uniqueUsers' } }
            }
        }
    ]);

    return {
        byType: usageStats,
        trends: calculateUsageTrends(usageStats),
        peakTimes: identifyPeakUsageTimes(usageStats)
    };
};

/**
 * 获取资源质量评估
 */
const getResourceQualityAssessment = async (adminID, category) => {
    // 知识库质量评估
    const kbQuality = await KnowledgeBase.aggregate([
        {
            $match: {
                school: adminID,
                ...(category !== 'all' && { type: category })
            }
        },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalRated: { $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] } },
                totalResources: { $sum: 1 }
            }
        }
    ]);

    // 题目质量评估
    const questionQuality = await Question.aggregate([
        {
            $match: {
                school: adminID,
                ...(category !== 'all' && { type: category })
            }
        },
        {
            $group: {
                _id: null,
                avgScore: { $avg: '$averageScore' },
                avgUsage: { $avg: '$usageCount' },
                totalQuestions: { $sum: 1 }
            }
        }
    ]);

    return {
        knowledgeBase: kbQuality[0] || {},
        questions: questionQuality[0] || {},
        overallQuality: calculateOverallQuality(kbQuality[0], questionQuality[0])
    };
};

/**
 * 获取资源分布
 */
const getResourceDistribution = async (adminID, category) => {
    // 按学科分布
    const subjectDistribution = await Subject.aggregate([
        {
            $match: { school: adminID }
        },
        {
            $lookup: {
                from: 'questions',
                localField: '_id',
                foreignField: 'subject',
                as: 'questions'
            }
        },
        {
            $lookup: {
                from: 'knowledgebases',
                localField: '_id',
                foreignField: 'subject',
                as: 'knowledgeBase'
            }
        },
        {
            $project: {
                subName: 1,
                questionCount: { $size: '$questions' },
                kbCount: { $size: '$knowledgeBase' }
            }
        }
    ]);

    // 按教师分布
    const teacherDistribution = await Teacher.aggregate([
        {
            $match: { school: adminID }
        },
        {
            $lookup: {
                from: 'lessonplans',
                localField: '_id',
                foreignField: 'teacher',
                as: 'lessonPlans'
            }
        },
        {
            $lookup: {
                from: 'questions',
                localField: '_id',
                foreignField: 'createdBy',
                as: 'questions'
            }
        },
        {
            $project: {
                name: 1,
                lessonPlanCount: { $size: '$lessonPlans' },
                questionCount: { $size: '$questions' }
            }
        },
        {
            $sort: { lessonPlanCount: -1 }
        },
        {
            $limit: 10
        }
    ]);

    return {
        bySubject: subjectDistribution,
        byTeacher: teacherDistribution,
        summary: {
            evenness: calculateDistributionEvenness(subjectDistribution),
            concentration: calculateResourceConcentration(teacherDistribution)
        }
    };
};

/**
 * 生成资源优化建议
 */
const generateResourceOptimizations = async (resourceStats, usageAnalysis, qualityAssessment) => {
    const optimizations = [];

    // 基于使用率的优化
    const lowUsageTypes = usageAnalysis.byType.filter(type => type.totalUsage < 10);
    if (lowUsageTypes.length > 0) {
        optimizations.push({
            type: 'usage_optimization',
            priority: 'medium',
            title: '提升低使用率资源',
            description: `${lowUsageTypes.map(t => t._id).join(', ')}类型资源使用率偏低`,
            actions: ['改进资源质量', '加强推广', '优化分类']
        });
    }

    // 基于质量的优化
    if (qualityAssessment.overallQuality < 70) {
        optimizations.push({
            type: 'quality_improvement',
            priority: 'high',
            title: '提升资源质量',
            description: '整体资源质量需要改进',
            actions: ['建立质量标准', '加强审核', '收集用户反馈']
        });
    }

    // 基于分布的优化
    optimizations.push({
        type: 'distribution_balance',
        priority: 'low',
        title: '平衡资源分布',
        description: '优化资源在各学科间的分布',
        actions: ['识别资源缺口', '鼓励创建', '资源共享']
    });

    return optimizations;
};

// 其他辅助函数的简化实现
const getDetailedUsageData = async (adminID, resourceType, timeRange, sortBy) => {
    return [
        {
            resourceId: 'resource1',
            title: '示例资源1',
            usageCount: 150,
            lastUsed: new Date(),
            avgRating: 4.2
        }
    ];
};

const getPopularResources = async (adminID, resourceType, timeRange) => {
    return [
        { id: 'resource1', title: '热门资源1', usage: 200 },
        { id: 'resource2', title: '热门资源2', usage: 180 }
    ];
};

const getUnderutilizedResources = async (adminID, resourceType, timeRange) => {
    return [
        { id: 'resource3', title: '低使用资源1', usage: 5 },
        { id: 'resource4', title: '低使用资源2', usage: 3 }
    ];
};

const analyzeUsagePatterns = async (adminID, resourceType, timeRange) => {
    return {
        peakHours: ['14:00-16:00', '19:00-21:00'],
        peakDays: ['周二', '周四'],
        seasonality: 'stable',
        userBehavior: 'consistent'
    };
};

const analyzeResourceNeeds = async (targetType, targetId, requirements) => {
    return {
        currentGaps: ['缺少高级练习题', '需要更多视频资源'],
        priority: 'high',
        timeline: '2周内',
        estimatedImpact: 'significant'
    };
};

const getAvailableResources = async (adminID, needsAnalysis) => {
    return [
        { id: 'resource5', type: 'question', relevance: 0.9 },
        { id: 'resource6', type: 'video', relevance: 0.8 }
    ];
};

const generateAllocationSuggestions = async (needsAnalysis, availableResources) => {
    return [
        {
            resource: 'resource5',
            allocation: 'immediate',
            reason: '高度匹配当前需求',
            expectedImpact: 'high'
        }
    ];
};

const predictAllocationEffect = async (suggestions, needsAnalysis) => {
    return {
        expectedImprovement: '25%',
        timeline: '4周',
        confidence: 0.8,
        risks: ['资源质量不确定']
    };
};

const calculateUsageTrends = (usageStats) => {
    return {
        overall: 'increasing',
        byType: usageStats.map(stat => ({
            type: stat._id,
            trend: 'stable'
        }))
    };
};

const identifyPeakUsageTimes = (usageStats) => {
    return {
        hourly: ['14:00', '15:00', '20:00'],
        daily: ['Tuesday', 'Thursday'],
        weekly: ['Week 2', 'Week 3']
    };
};

const calculateOverallQuality = (kbQuality, questionQuality) => {
    const kbScore = (kbQuality?.avgRating || 0) * 20;
    const questionScore = (questionQuality?.avgScore || 0);
    return (kbScore + questionScore) / 2;
};

const calculateDistributionEvenness = (distribution) => {
    return 75; // 简化实现
};

const calculateResourceConcentration = (distribution) => {
    return 60; // 简化实现
};

const getResourcesForEvaluation = async (resourceIds) => {
    return [
        { _id: 'resource1', title: '示例资源', type: 'document' }
    ];
};

const evaluateIndividualResource = async (resource, evaluationType) => {
    return {
        qualityScore: 85,
        usabilityScore: 78,
        relevanceScore: 92,
        overallScore: 85,
        strengths: ['内容丰富', '结构清晰'],
        improvements: ['需要更新', '增加互动性']
    };
};

const generateQualityReport = async (evaluations) => {
    return {
        averageScore: 82,
        distribution: { excellent: 3, good: 5, fair: 2 },
        topPerformers: evaluations.slice(0, 3),
        needsImprovement: evaluations.filter(e => e.evaluation.overallScore < 70)
    };
};

const generateQualityImprovements = async (evaluations) => {
    return [
        {
            area: '内容更新',
            priority: 'high',
            affectedResources: 5,
            actions: ['定期审查', '内容更新', '质量检查']
        }
    ];
};

const getHistoricalUsageData = async (adminID, resourceType) => {
    return {
        monthly: [100, 120, 110, 130, 125],
        growth: 15,
        seasonality: 'moderate'
    };
};

const getCurrentUsageTrends = async (adminID, resourceType) => {
    return {
        direction: 'increasing',
        rate: 8.5,
        acceleration: 'stable'
    };
};

const predictFutureDemand = async (historicalData, currentTrends, timeHorizon) => {
    return {
        predicted: [140, 150, 160],
        confidence: 0.75,
        factors: ['用户增长', '功能改进', '季节性变化']
    };
};

const generateResourcePlanningRecommendations = async (demandPrediction) => {
    return [
        {
            action: '增加服务器容量',
            timeline: '1个月内',
            priority: 'high',
            cost: 'medium'
        }
    ];
};

const getResourceSharingStats = async (adminID, scope, resourceType) => {
    return {
        totalShared: 45,
        sharingRate: 65,
        mostSharedTypes: ['document', 'video'],
        sharingTrends: 'increasing'
    };
};

const analyzeSharingEffectiveness = async (sharingStats) => {
    return {
        effectiveness: 78,
        benefits: ['减少重复工作', '提升质量'],
        challenges: ['版权问题', '质量控制']
    };
};

const identifySharingOpportunities = async (adminID, resourceType) => {
    return [
        {
            opportunity: '跨学科资源共享',
            potential: 'high',
            barriers: ['技术限制', '政策约束']
        }
    ];
};

const generateSharingOptimizations = async (sharingStats, opportunities) => {
    return [
        {
            optimization: '建立共享平台',
            impact: 'high',
            effort: 'medium',
            timeline: '3个月'
        }
    ];
};

module.exports = {
    getResourceOverview,
    getResourceUsageDetail,
    getResourceAllocationSuggestions,
    evaluateResourceQuality,
    predictResourceDemand,
    analyzeResourceSharing
};
