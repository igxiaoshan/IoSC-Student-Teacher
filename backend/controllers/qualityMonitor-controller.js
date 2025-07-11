const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Exam = require('../models/examSchema');
const Answer = require('../models/answerSchema');
const LessonPlan = require('../models/lessonPlanSchema');
const PerformanceAnalysis = require('../models/performanceAnalysisSchema');
const Feedback = require('../models/feedbackSchema');
const aiService = require('../services/aiService');

/**
 * 获取教学质量监控概览
 */
const getQualityOverview = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { period = 'semester', subject } = req.query;

        // 计算时间范围
        const timeRange = calculatePeriodRange(period);

        // 获取教学质量指标
        const qualityMetrics = await getQualityMetrics(adminID, timeRange, subject);

        // 获取教师表现排名
        const teacherRankings = await getTeacherPerformanceRankings(adminID, timeRange, subject);

        // 获取学科表现分析
        const subjectAnalysis = await getSubjectPerformanceAnalysis(adminID, timeRange);

        // 获取质量趋势
        const qualityTrends = await getQualityTrends(adminID, timeRange, subject);

        // 生成质量报告
        const qualityReport = await generateQualityReport(qualityMetrics, teacherRankings, subjectAnalysis);

        res.json({
            adminID,
            period,
            subject,
            overview: qualityMetrics,
            teacherRankings: teacherRankings,
            subjectAnalysis: subjectAnalysis,
            trends: qualityTrends,
            report: qualityReport,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取教学质量监控概览错误:', error);
        res.status(500).json({
            message: '获取教学质量监控概览失败',
            error: error.message
        });
    }
};

/**
 * 获取教师表现详细分析
 */
const getTeacherPerformanceDetail = async (req, res) => {
    try {
        const { adminID, teacherId } = req.params;
        const { period = 'semester' } = req.query;

        // 验证教师
        const teacher = await Teacher.findById(teacherId)
            .populate('teachSubject', 'subName')
            .populate('teachSclass', 'sclassName');

        if (!teacher || teacher.school.toString() !== adminID) {
            return res.status(404).json({ message: '教师不存在或无权限访问' });
        }

        const timeRange = calculatePeriodRange(period);

        // 获取教师详细表现数据
        const performanceData = await getTeacherDetailedPerformance(teacherId, timeRange);

        // AI分析教师表现
        const aiAnalysis = await analyzeTeacherPerformance(teacherId, performanceData);

        // 生成改进建议
        const improvements = await generateTeacherImprovements(teacherId, performanceData, aiAnalysis);

        // 对比分析
        const comparison = await compareTeacherPerformance(teacherId, adminID, timeRange);

        res.json({
            teacher: {
                id: teacher._id,
                name: teacher.name,
                subject: teacher.teachSubject?.subName,
                class: teacher.teachSclass?.sclassName
            },
            period,
            performance: performanceData,
            analysis: aiAnalysis,
            improvements: improvements,
            comparison: comparison,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取教师表现详细分析错误:', error);
        res.status(500).json({
            message: '获取教师表现详细分析失败',
            error: error.message
        });
    }
};

/**
 * 获取学科质量分析
 */
const getSubjectQualityAnalysis = async (req, res) => {
    try {
        const { adminID, subjectId } = req.params;
        const { period = 'semester', grade } = req.query;

        // 验证学科
        const subject = await Subject.findById(subjectId);
        if (!subject || subject.school.toString() !== adminID) {
            return res.status(404).json({ message: '学科不存在或无权限访问' });
        }

        const timeRange = calculatePeriodRange(period);

        // 获取学科质量数据
        const qualityData = await getSubjectQualityData(subjectId, timeRange, grade);

        // 分析学科教学效果
        const effectiveness = await analyzeSubjectEffectiveness(subjectId, qualityData);

        // 识别问题和机会
        const issues = await identifySubjectIssues(qualityData);
        const opportunities = await identifySubjectOpportunities(qualityData);

        // 生成学科改进计划
        const improvementPlan = await generateSubjectImprovementPlan(subjectId, qualityData, effectiveness);

        res.json({
            subject: {
                id: subject._id,
                name: subject.subName,
                code: subject.subCode
            },
            period,
            grade,
            qualityData: qualityData,
            effectiveness: effectiveness,
            issues: issues,
            opportunities: opportunities,
            improvementPlan: improvementPlan,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取学科质量分析错误:', error);
        res.status(500).json({
            message: '获取学科质量分析失败',
            error: error.message
        });
    }
};

/**
 * 获取班级表现分析
 */
const getClassPerformanceAnalysis = async (req, res) => {
    try {
        const { adminID, classId } = req.params;
        const { period = 'semester', subject } = req.query;

        // 验证班级
        const classInfo = await require('../models/sclassSchema').findById(classId);
        if (!classInfo || classInfo.school.toString() !== adminID) {
            return res.status(404).json({ message: '班级不存在或无权限访问' });
        }

        const timeRange = calculatePeriodRange(period);

        // 获取班级表现数据
        const performanceData = await getClassPerformanceData(classId, timeRange, subject);

        // 分析班级学习状况
        const learningStatus = await analyzeClassLearningStatus(classId, performanceData);

        // 识别优秀学生和需要帮助的学生
        const studentCategories = await categorizeStudents(classId, performanceData);

        // 生成班级改进建议
        const classImprovements = await generateClassImprovements(classId, performanceData, learningStatus);

        res.json({
            class: {
                id: classInfo._id,
                name: classInfo.sclassName
            },
            period,
            subject,
            performance: performanceData,
            learningStatus: learningStatus,
            studentCategories: studentCategories,
            improvements: classImprovements,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取班级表现分析错误:', error);
        res.status(500).json({
            message: '获取班级表现分析失败',
            error: error.message
        });
    }
};

/**
 * 生成质量改进建议
 */
const generateQualityImprovements = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { targetType, targetId, priority = 'all' } = req.body;

        // 获取目标数据
        const targetData = await getTargetData(targetType, targetId, adminID);

        // AI分析并生成改进建议
        const aiResult = await aiService.evaluateTeachingQuality(targetData);

        let improvements;
        if (aiResult.success) {
            improvements = aiResult.evaluation.recommendations || [];
        } else {
            improvements = await generateBasicImprovements(targetData);
        }

        // 按优先级过滤
        if (priority !== 'all') {
            improvements = improvements.filter(imp => imp.priority === priority);
        }

        // 生成实施计划
        const implementationPlan = await generateImplementationPlan(improvements, targetType);

        res.json({
            targetType,
            targetId,
            priority,
            improvements: improvements,
            implementationPlan: implementationPlan,
            aiGenerated: aiResult.success,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('生成质量改进建议错误:', error);
        res.status(500).json({
            message: '生成质量改进建议失败',
            error: error.message
        });
    }
};

/**
 * 获取质量预警
 */
const getQualityAlerts = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { severity = 'all', category = 'all' } = req.query;

        // 检测质量问题
        const alerts = await detectQualityIssues(adminID);

        // 按严重程度过滤
        let filteredAlerts = alerts;
        if (severity !== 'all') {
            filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
        }

        // 按类别过滤
        if (category !== 'all') {
            filteredAlerts = filteredAlerts.filter(alert => alert.category === category);
        }

        // 生成处理建议
        const actionPlans = await generateAlertActionPlans(filteredAlerts);

        res.json({
            adminID,
            severity,
            category,
            alerts: filteredAlerts,
            actionPlans: actionPlans,
            summary: {
                total: alerts.length,
                high: alerts.filter(a => a.severity === 'high').length,
                medium: alerts.filter(a => a.severity === 'medium').length,
                low: alerts.filter(a => a.severity === 'low').length
            },
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取质量预警错误:', error);
        res.status(500).json({
            message: '获取质量预警失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 计算时期范围
 */
const calculatePeriodRange = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
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
            startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
};

/**
 * 获取质量指标
 */
const getQualityMetrics = async (adminID, timeRange, subject) => {
    const { startDate, endDate } = timeRange;

    // 教学质量指标
    const teachingMetrics = await Exam.aggregate([
        {
            $match: {
                school: adminID,
                startTime: { $gte: startDate, $lte: endDate },
                ...(subject && { subject: subject })
            }
        },
        {
            $group: {
                _id: null,
                totalExams: { $sum: 1 },
                avgScore: { $avg: '$statistics.averageScore' },
                avgPassRate: { $avg: '$statistics.passRate' },
                avgCompletionRate: { $avg: '$statistics.completionRate' }
            }
        }
    ]);

    // 学习效果指标
    const learningMetrics = await Answer.aggregate([
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
                submitTime: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAnswers: { $sum: 1 },
                correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                avgTimeSpent: { $avg: '$timeSpent' }
            }
        }
    ]);

    const teaching = teachingMetrics[0] || {};
    const learning = learningMetrics[0] || {};

    return {
        teaching: {
            examCount: teaching.totalExams || 0,
            averageScore: teaching.avgScore || 0,
            passRate: teaching.avgPassRate || 0,
            completionRate: teaching.avgCompletionRate || 0
        },
        learning: {
            totalAnswers: learning.totalAnswers || 0,
            accuracy: learning.totalAnswers > 0 ? 
                (learning.correctAnswers / learning.totalAnswers) * 100 : 0,
            averageTimeSpent: learning.avgTimeSpent || 0
        },
        overallQuality: calculateOverallQuality(teaching, learning)
    };
};

/**
 * 获取教师表现排名
 */
const getTeacherPerformanceRankings = async (adminID, timeRange, subject) => {
    const { startDate, endDate } = timeRange;

    const rankings = await Teacher.aggregate([
        {
            $match: {
                school: adminID,
                ...(subject && { teachSubject: subject })
            }
        },
        {
            $lookup: {
                from: 'exams',
                localField: '_id',
                foreignField: 'createdBy',
                as: 'exams'
            }
        },
        {
            $addFields: {
                recentExams: {
                    $filter: {
                        input: '$exams',
                        cond: {
                            $and: [
                                { $gte: ['$$this.startTime', startDate] },
                                { $lte: ['$$this.startTime', endDate] }
                            ]
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                examCount: { $size: '$recentExams' },
                avgScore: { $avg: '$recentExams.statistics.averageScore' },
                avgPassRate: { $avg: '$recentExams.statistics.passRate' }
            }
        },
        {
            $addFields: {
                performanceScore: {
                    $add: [
                        { $multiply: ['$avgScore', 0.4] },
                        { $multiply: ['$avgPassRate', 0.4] },
                        { $multiply: ['$examCount', 2] }
                    ]
                }
            }
        },
        {
            $sort: { performanceScore: -1 }
        },
        {
            $limit: 20
        },
        {
            $project: {
                name: 1,
                examCount: 1,
                avgScore: 1,
                avgPassRate: 1,
                performanceScore: 1
            }
        }
    ]);

    return rankings;
};

/**
 * 获取学科表现分析
 */
const getSubjectPerformanceAnalysis = async (adminID, timeRange) => {
    const { startDate, endDate } = timeRange;

    const subjectAnalysis = await Subject.aggregate([
        {
            $match: { school: adminID }
        },
        {
            $lookup: {
                from: 'exams',
                localField: '_id',
                foreignField: 'subject',
                as: 'exams'
            }
        },
        {
            $addFields: {
                recentExams: {
                    $filter: {
                        input: '$exams',
                        cond: {
                            $and: [
                                { $gte: ['$$this.startTime', startDate] },
                                { $lte: ['$$this.startTime', endDate] }
                            ]
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                examCount: { $size: '$recentExams' },
                avgScore: { $avg: '$recentExams.statistics.averageScore' },
                avgPassRate: { $avg: '$recentExams.statistics.passRate' }
            }
        },
        {
            $project: {
                subName: 1,
                subCode: 1,
                examCount: 1,
                avgScore: 1,
                avgPassRate: 1
            }
        }
    ]);

    return subjectAnalysis;
};

/**
 * 获取质量趋势
 */
const getQualityTrends = async (adminID, timeRange, subject) => {
    // 简化实现，实际应该进行时间序列分析
    return {
        scoresTrend: {
            direction: 'increasing',
            rate: 5.2,
            data: [75, 77, 79, 81, 83]
        },
        passRateTrend: {
            direction: 'stable',
            rate: 1.1,
            data: [85, 86, 85, 87, 86]
        },
        engagementTrend: {
            direction: 'increasing',
            rate: 8.3,
            data: [70, 73, 76, 78, 82]
        }
    };
};

/**
 * 生成质量报告
 */
const generateQualityReport = async (qualityMetrics, teacherRankings, subjectAnalysis) => {
    return {
        summary: {
            overallRating: qualityMetrics.overallQuality,
            topPerformers: teacherRankings.slice(0, 3),
            bestSubjects: subjectAnalysis.sort((a, b) => b.avgScore - a.avgScore).slice(0, 3),
            areasForImprovement: identifyImprovementAreas(qualityMetrics, subjectAnalysis)
        },
        recommendations: [
            '继续推广高效教学方法',
            '加强薄弱学科的支持',
            '提升教师专业发展'
        ]
    };
};

// 其他辅助函数的简化实现
const calculateOverallQuality = (teaching, learning) => {
    const teachingScore = (teaching.avgScore || 0) * 0.4 + (teaching.avgPassRate || 0) * 0.3;
    const learningScore = (learning.accuracy || 0) * 0.3;
    return Math.min(teachingScore + learningScore, 100);
};

const getTeacherDetailedPerformance = async (teacherId, timeRange) => {
    return {
        examMetrics: { count: 5, avgScore: 82, passRate: 88 },
        studentFeedback: { rating: 4.2, responseRate: 75 },
        contentQuality: { aiUsage: 65, originalityScore: 78 },
        engagement: { participationRate: 85, interactionScore: 72 }
    };
};

const analyzeTeacherPerformance = async (teacherId, performanceData) => {
    return {
        strengths: ['学生参与度高', '考试成绩优秀'],
        weaknesses: ['AI工具使用率偏低'],
        overallRating: 82,
        recommendations: ['增加AI工具使用', '保持当前教学方法']
    };
};

const generateTeacherImprovements = async (teacherId, performanceData, aiAnalysis) => {
    return [
        {
            area: 'AI工具使用',
            current: 65,
            target: 80,
            actions: ['参加AI工具培训', '尝试AI辅助备课'],
            timeline: '1个月'
        }
    ];
};

const compareTeacherPerformance = async (teacherId, adminID, timeRange) => {
    return {
        schoolAverage: 78,
        subjectAverage: 80,
        ranking: 5,
        percentile: 85
    };
};

const identifyImprovementAreas = (qualityMetrics, subjectAnalysis) => {
    return ['数学学科需要加强', '学生参与度有待提升'];
};

const getSubjectQualityData = async (subjectId, timeRange, grade) => {
    return {
        examPerformance: { avgScore: 78, passRate: 85 },
        studentEngagement: { participationRate: 82 },
        teacherEffectiveness: { rating: 4.1 },
        resourceUtilization: { usage: 75 }
    };
};

const analyzeSubjectEffectiveness = async (subjectId, qualityData) => {
    return {
        overallEffectiveness: 78,
        strengths: ['考试成绩稳定'],
        challenges: ['学生参与度需提升'],
        recommendations: ['增加互动性教学']
    };
};

const identifySubjectIssues = async (qualityData) => {
    return [
        { issue: '部分知识点掌握不牢', severity: 'medium' }
    ];
};

const identifySubjectOpportunities = async (qualityData) => {
    return [
        { opportunity: '可以引入更多实践项目', impact: 'high' }
    ];
};

const generateSubjectImprovementPlan = async (subjectId, qualityData, effectiveness) => {
    return {
        shortTerm: ['增加练习题量', '改进教学方法'],
        longTerm: ['开发新课程内容', '培训教师团队'],
        timeline: '6个月',
        expectedImprovement: '15%'
    };
};

const getClassPerformanceData = async (classId, timeRange, subject) => {
    return {
        academicPerformance: { avgScore: 76, passRate: 82 },
        attendance: { rate: 95 },
        engagement: { participationRate: 78 },
        progress: { improvementRate: 12 }
    };
};

const analyzeClassLearningStatus = async (classId, performanceData) => {
    return {
        overallStatus: 'good',
        strengths: ['出勤率高', '基础扎实'],
        challenges: ['参与度需提升'],
        recommendations: ['增加互动环节']
    };
};

const categorizeStudents = async (classId, performanceData) => {
    return {
        excellent: { count: 8, percentage: 25 },
        good: { count: 18, percentage: 56 },
        needsHelp: { count: 6, percentage: 19 }
    };
};

const generateClassImprovements = async (classId, performanceData, learningStatus) => {
    return [
        {
            area: '学生参与度',
            actions: ['增加小组讨论', '引入游戏化元素'],
            timeline: '2周'
        }
    ];
};

const getTargetData = async (targetType, targetId, adminID) => {
    return {
        type: targetType,
        id: targetId,
        performance: { score: 75 },
        context: { school: adminID }
    };
};

const generateBasicImprovements = async (targetData) => {
    return [
        {
            area: '教学方法',
            priority: 'high',
            description: '改进教学方法以提升效果',
            actions: ['采用互动式教学', '增加实践环节']
        }
    ];
};

const generateImplementationPlan = async (improvements, targetType) => {
    return {
        phases: improvements.map((imp, index) => ({
            phase: index + 1,
            improvement: imp.area,
            duration: '4周',
            milestones: ['计划制定', '实施开始', '中期评估', '效果评价']
        })),
        totalDuration: '12周'
    };
};

const detectQualityIssues = async (adminID) => {
    return [
        {
            id: 1,
            type: 'performance_decline',
            severity: 'medium',
            category: 'academic',
            title: '数学成绩下降',
            description: '数学学科平均分较上月下降5分',
            affectedCount: 45,
            detectedAt: new Date()
        },
        {
            id: 2,
            type: 'low_engagement',
            severity: 'high',
            category: 'engagement',
            title: '学生参与度偏低',
            description: '在线学习参与率低于70%',
            affectedCount: 120,
            detectedAt: new Date()
        }
    ];
};

const generateAlertActionPlans = async (alerts) => {
    return alerts.map(alert => ({
        alertId: alert.id,
        actions: [
            '分析具体原因',
            '制定改进措施',
            '实施干预方案',
            '监控改进效果'
        ],
        priority: alert.severity,
        estimatedTime: '2-4周'
    }));
};

module.exports = {
    getQualityOverview,
    getTeacherPerformanceDetail,
    getSubjectQualityAnalysis,
    getClassPerformanceAnalysis,
    generateQualityImprovements,
    getQualityAlerts
};
