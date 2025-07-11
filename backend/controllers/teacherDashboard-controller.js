const LessonPlan = require('../models/lessonPlanSchema');
const Question = require('../models/questionSchema');
const Exam = require('../models/examSchema');
const Answer = require('../models/answerSchema');
const Student = require('../models/studentSchema');
const PerformanceAnalysis = require('../models/performanceAnalysisSchema');
const UsageStat = require('../models/usageStatSchema');
const aiService = require('../services/aiService');

/**
 * 获取教师仪表板概览数据
 */
const getTeacherDashboard = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { timeRange = 'month' } = req.query;

        // 计算时间范围
        const now = new Date();
        let startDate;
        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'semester':
                startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // 获取教师基本信息
        const teacher = await require('../models/teacherSchema').findById(teacherId)
            .populate('teachSubject', 'subName subCode')
            .populate('teachSclass', 'sclassName')
            .populate('school', 'schoolName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 并行获取各种统计数据
        const [
            lessonPlanStats,
            questionStats,
            examStats,
            studentPerformanceStats,
            usageStats,
            recentActivities
        ] = await Promise.all([
            getLessonPlanStatistics(teacherId, startDate),
            getQuestionStatistics(teacherId, startDate),
            getExamStatistics(teacherId, startDate),
            getStudentPerformanceStatistics(teacher.teachSclass._id, startDate),
            getUsageStatistics(teacherId, startDate),
            getRecentActivities(teacherId, startDate)
        ]);

        // 计算教学效率指标
        const teachingEfficiency = calculateTeachingEfficiency({
            lessonPlanStats,
            questionStats,
            examStats,
            studentPerformanceStats
        });

        // 生成AI洞察
        const aiInsights = await generateTeachingInsights({
            teacher,
            lessonPlanStats,
            questionStats,
            examStats,
            studentPerformanceStats,
            timeRange
        });

        res.json({
            teacher: {
                id: teacher._id,
                name: teacher.name,
                subject: teacher.teachSubject.subName,
                class: teacher.teachSclass.sclassName,
                school: teacher.school.schoolName
            },
            timeRange,
            overview: {
                lessonPlans: lessonPlanStats,
                questions: questionStats,
                exams: examStats,
                studentPerformance: studentPerformanceStats,
                teachingEfficiency
            },
            usage: usageStats,
            recentActivities,
            aiInsights,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('获取教师仪表板错误:', error);
        res.status(500).json({
            message: '获取教师仪表板失败',
            error: error.message
        });
    }
};

/**
 * 获取教学效果分析
 */
const getTeachingEffectiveness = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { startDate, endDate, subject } = req.query;

        const teacher = await require('../models/teacherSchema').findById(teacherId)
            .populate('teachSclass', 'sclassName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 获取班级学生
        const students = await Student.find({ sclassName: teacher.teachSclass._id });
        const studentIds = students.map(s => s._id);

        // 分析学生表现趋势
        const performanceTrend = await analyzePerformanceTrend(studentIds, {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        // 分析知识点掌握情况
        const knowledgeMastery = await analyzeKnowledgeMastery(studentIds, subject);

        // 分析教学方法效果
        const teachingMethodEffectiveness = await analyzeTeachingMethods(teacherId, {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        // 生成改进建议
        const improvementSuggestions = await generateImprovementSuggestions({
            performanceTrend,
            knowledgeMastery,
            teachingMethodEffectiveness
        });

        res.json({
            teacherId,
            analysisDate: new Date(),
            performanceTrend,
            knowledgeMastery,
            teachingMethodEffectiveness,
            improvementSuggestions,
            classInfo: {
                name: teacher.teachSclass.sclassName,
                studentCount: students.length
            }
        });

    } catch (error) {
        console.error('获取教学效果分析错误:', error);
        res.status(500).json({
            message: '获取教学效果分析失败',
            error: error.message
        });
    }
};

/**
 * 获取学生学习困难分析
 */
const getStudentDifficulties = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { subject, difficulty = 'all' } = req.query;

        const teacher = await require('../models/teacherSchema').findById(teacherId)
            .populate('teachSclass', 'sclassName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 获取班级学生
        const students = await Student.find({ sclassName: teacher.teachSclass._id });
        const studentIds = students.map(s => s._id);

        // 分析学生困难
        const difficulties = await analyzeStudentDifficulties(studentIds, subject, difficulty);

        // 按困难程度分组
        const groupedDifficulties = groupDifficultiesByLevel(difficulties);

        // 生成针对性建议
        const targetedSuggestions = await generateTargetedSuggestions(groupedDifficulties);

        res.json({
            teacherId,
            classId: teacher.teachSclass._id,
            className: teacher.teachSclass.sclassName,
            subject,
            analysisDate: new Date(),
            difficulties: groupedDifficulties,
            suggestions: targetedSuggestions,
            summary: {
                totalStudents: students.length,
                studentsWithDifficulties: difficulties.length,
                difficultyRate: (difficulties.length / students.length) * 100
            }
        });

    } catch (error) {
        console.error('获取学生学习困难分析错误:', error);
        res.status(500).json({
            message: '获取学生学习困难分析失败',
            error: error.message
        });
    }
};

/**
 * 生成教学建议
 */
const generateTeachingSuggestions = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { context, specificArea } = req.body;

        const teacher = await require('../models/teacherSchema').findById(teacherId)
            .populate('teachSubject', 'subName')
            .populate('teachSclass', 'sclassName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 收集教学数据
        const teachingData = await collectTeachingData(teacherId, context);

        // 调用AI服务生成建议
        const aiResult = await aiService.evaluateTeachingQuality(teachingData);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'AI生成教学建议失败',
                error: aiResult.error
            });
        }

        // 保存建议记录
        const suggestionRecord = {
            teacherId,
            subject: teacher.teachSubject.subName,
            class: teacher.teachSclass.sclassName,
            context,
            specificArea,
            suggestions: aiResult.evaluation,
            generatedAt: new Date(),
            aiGenerated: true
        };

        res.json({
            message: '教学建议生成成功',
            data: suggestionRecord,
            aiMetadata: {
                confidence: aiResult.confidence || 0.8,
                generatedAt: new Date()
            }
        });

    } catch (error) {
        console.error('生成教学建议错误:', error);
        res.status(500).json({
            message: '生成教学建议失败',
            error: error.message
        });
    }
};

// 辅助函数

const getLessonPlanStatistics = async (teacherId, startDate) => {
    const stats = await LessonPlan.aggregate([
        {
            $match: {
                teacher: teacherId,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
                avgDuration: { $avg: '$duration' },
                statusDistribution: {
                    $push: '$status'
                }
            }
        }
    ]);

    return stats[0] || { total: 0, aiGenerated: 0, avgDuration: 0, statusDistribution: [] };
};

const getQuestionStatistics = async (teacherId, startDate) => {
    const stats = await Question.aggregate([
        {
            $match: {
                createdBy: teacherId,
                createdAt: { $gte: startDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
                avgUsage: { $avg: '$usageCount' },
                typeDistribution: {
                    $push: '$type'
                },
                difficultyDistribution: {
                    $push: '$difficulty'
                }
            }
        }
    ]);

    return stats[0] || { total: 0, aiGenerated: 0, avgUsage: 0, typeDistribution: [], difficultyDistribution: [] };
};

const getExamStatistics = async (teacherId, startDate) => {
    const stats = await Exam.aggregate([
        {
            $match: {
                createdBy: teacherId,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
                avgScore: { $avg: '$statistics.averageScore' },
                avgPassRate: { $avg: '$statistics.passRate' }
            }
        }
    ]);

    return stats[0] || { total: 0, aiGenerated: 0, avgScore: 0, avgPassRate: 0 };
};

const getStudentPerformanceStatistics = async (classId, startDate) => {
    const students = await Student.find({ sclassName: classId });
    const studentIds = students.map(s => s._id);

    const performanceStats = await Answer.aggregate([
        {
            $match: {
                student: { $in: studentIds },
                submitTime: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAnswers: { $sum: 1 },
                correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                avgScore: { $avg: '$score' },
                avgTime: { $avg: '$timeSpent' }
            }
        }
    ]);

    const stats = performanceStats[0] || { totalAnswers: 0, correctAnswers: 0, avgScore: 0, avgTime: 0 };
    stats.accuracy = stats.totalAnswers > 0 ? (stats.correctAnswers / stats.totalAnswers) * 100 : 0;
    stats.totalStudents = students.length;

    return stats;
};

const getUsageStatistics = async (teacherId, startDate) => {
    const usageStats = await UsageStat.aggregate([
        {
            $match: {
                user: teacherId,
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
    ]);

    return usageStats;
};

const getRecentActivities = async (teacherId, startDate) => {
    // 获取最近的活动记录
    const activities = await UsageStat.find({
        user: teacherId,
        date: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('activityType activityDetails createdAt');

    return activities;
};

const calculateTeachingEfficiency = (stats) => {
    const { lessonPlanStats, questionStats, examStats, studentPerformanceStats } = stats;

    return {
        contentCreationEfficiency: {
            aiAssistedRatio: lessonPlanStats.total > 0 ? (lessonPlanStats.aiGenerated / lessonPlanStats.total) * 100 : 0,
            questionGenerationRate: questionStats.total,
            avgLessonPlanDuration: lessonPlanStats.avgDuration
        },
        studentEngagement: {
            participationRate: studentPerformanceStats.totalAnswers > 0 ? 100 : 0,
            averageAccuracy: studentPerformanceStats.accuracy,
            averageResponseTime: studentPerformanceStats.avgTime
        },
        assessmentEffectiveness: {
            examCount: examStats.total,
            averageScore: examStats.avgScore,
            passRate: examStats.avgPassRate
        }
    };
};

const generateTeachingInsights = async (data) => {
    // 基于数据生成教学洞察
    const insights = [];

    if (data.studentPerformanceStats.accuracy < 60) {
        insights.push({
            type: 'warning',
            title: '学生答题准确率偏低',
            description: `当前班级平均准确率为${data.studentPerformanceStats.accuracy.toFixed(1)}%，建议调整教学策略`,
            priority: 'high',
            suggestions: ['增加基础知识复习', '调整题目难度', '提供更多练习机会']
        });
    }

    if (data.lessonPlanStats.aiGenerated / data.lessonPlanStats.total > 0.8) {
        insights.push({
            type: 'success',
            title: 'AI辅助教学应用良好',
            description: `AI生成内容占比${((data.lessonPlanStats.aiGenerated / data.lessonPlanStats.total) * 100).toFixed(1)}%，有效提升了备课效率`,
            priority: 'medium',
            suggestions: ['继续优化AI生成内容', '结合人工调整提升质量']
        });
    }

    return insights;
};

const analyzePerformanceTrend = async (studentIds, timeRange) => {
    // 实现性能趋势分析
    return {};
};

const analyzeKnowledgeMastery = async (studentIds, subject) => {
    // 实现知识掌握分析
    return {};
};

const analyzeTeachingMethods = async (teacherId, timeRange) => {
    // 实现教学方法分析
    return {};
};

const generateImprovementSuggestions = async (analysisData) => {
    // 生成改进建议
    return [];
};

const analyzeStudentDifficulties = async (studentIds, subject, difficulty) => {
    // 分析学生困难
    return [];
};

const groupDifficultiesByLevel = (difficulties) => {
    // 按困难程度分组
    return {
        high: [],
        medium: [],
        low: []
    };
};

const generateTargetedSuggestions = async (groupedDifficulties) => {
    // 生成针对性建议
    return [];
};

const collectTeachingData = async (teacherId, context) => {
    // 收集教学数据
    return {
        teacherId,
        context,
        subject: context.subject,
        recentPerformance: {},
        teachingMethods: [],
        studentFeedback: []
    };
};

module.exports = {
    getTeacherDashboard,
    getTeachingEffectiveness,
    getStudentDifficulties,
    generateTeachingSuggestions
};
