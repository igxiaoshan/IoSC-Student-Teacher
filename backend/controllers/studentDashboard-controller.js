const Student = require('../models/studentSchema');
const Answer = require('../models/answerSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const Exam = require('../models/examSchema');
const Question = require('../models/questionSchema');
const aiService = require('../services/aiService');

/**
 * 获取学生仪表板概览
 */
const getStudentDashboard = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { timeRange = 'week' } = req.query;

        // 验证学生
        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('school', 'schoolName');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 计算时间范围
        const now = new Date();
        let startDate;
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
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // 并行获取各种数据
        const [
            learningStats,
            practiceStats,
            performanceStats,
            upcomingTasks,
            achievements,
            learningInsights
        ] = await Promise.all([
            getLearningStatisticsData(studentId, startDate),
            getPracticeStatistics(studentId, startDate),
            getPerformanceStatistics(studentId, startDate),
            getUpcomingTasks(studentId),
            getRecentAchievements(studentId),
            generateLearningInsights(studentId, startDate)
        ]);

        // 计算学习指标
        const learningMetrics = calculateLearningMetrics({
            learningStats,
            practiceStats,
            performanceStats
        });

        // 获取个性化建议
        const personalizedSuggestions = await generatePersonalizedSuggestions(studentId, {
            learningStats,
            practiceStats,
            performanceStats
        });

        res.json({
            student: {
                id: student._id,
                name: student.name,
                class: student.sclassName.sclassName,
                school: student.school.schoolName
            },
            timeRange,
            overview: {
                learning: learningStats,
                practice: practiceStats,
                performance: performanceStats,
                metrics: learningMetrics
            },
            upcomingTasks,
            achievements,
            insights: learningInsights,
            suggestions: personalizedSuggestions,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('获取学生仪表板错误:', error);
        res.status(500).json({
            message: '获取学生仪表板失败',
            error: error.message
        });
    }
};

/**
 * 获取学习目标进度
 */
const getLearningGoalsProgress = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学习目标
        const goals = await getStudentGoals(studentId);

        // 计算目标进度
        const goalsProgress = await Promise.all(
            goals.map(async (goal) => {
                const progress = await calculateGoalProgress(studentId, goal);
                return {
                    ...goal,
                    progress: progress,
                    status: determineGoalStatus(progress, goal.deadline),
                    nextMilestone: getNextMilestone(goal, progress)
                };
            })
        );

        // 生成目标建议
        const goalSuggestions = await generateGoalSuggestions(studentId, goalsProgress);

        res.json({
            studentId,
            goals: goalsProgress,
            summary: {
                totalGoals: goals.length,
                completedGoals: goalsProgress.filter(g => g.status === 'completed').length,
                inProgressGoals: goalsProgress.filter(g => g.status === 'in_progress').length,
                overallProgress: goalsProgress.reduce((sum, g) => sum + g.progress.percentage, 0) / goals.length || 0
            },
            suggestions: goalSuggestions
        });

    } catch (error) {
        console.error('获取学习目标进度错误:', error);
        res.status(500).json({
            message: '获取学习目标进度失败',
            error: error.message
        });
    }
};

/**
 * 获取学习建议
 */
const getPersonalizedSuggestions = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { context, priority } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生学习状态
        const learningState = await getComprehensiveLearningState(studentId);

        // 生成个性化建议
        const suggestions = await generateComprehensiveSuggestions(learningState, {
            context: context || 'general',
            priority: priority || 'medium'
        });

        // 按类型分组建议
        const groupedSuggestions = groupSuggestionsByType(suggestions);

        res.json({
            studentId,
            context,
            suggestions: groupedSuggestions,
            learningState: {
                currentLevel: learningState.level,
                strengths: learningState.strengths.slice(0, 3),
                improvements: learningState.weaknesses.slice(0, 3),
                mood: learningState.mood
            },
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取个性化建议错误:', error);
        res.status(500).json({
            message: '获取个性化建议失败',
            error: error.message
        });
    }
};

/**
 * 获取学习统计
 */
const getLearningStatistics = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, period = 'month' } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 计算时间范围
        const timeRange = calculateTimeRange(period);

        // 获取详细统计
        const statistics = await getDetailedStatistics(studentId, subject, timeRange);

        // 生成趋势分析
        const trends = await analyzeLearningTrends(studentId, subject, timeRange);

        // 对比分析
        const comparison = await generateComparison(studentId, statistics, timeRange);

        res.json({
            studentId,
            subject,
            period,
            statistics: statistics,
            trends: trends,
            comparison: comparison,
            insights: await generateStatisticalInsights(statistics, trends),
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取学习统计错误:', error);
        res.status(500).json({
            message: '获取学习统计失败',
            error: error.message
        });
    }
};

/**
 * 获取学习报告
 */
const getLearningReport = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { reportType = 'weekly', includeComparison = false } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 生成学习报告
        const report = await generateLearningReport(studentId, reportType);

        // 添加对比数据（如果需要）
        if (includeComparison === 'true') {
            report.comparison = await generateComparisonData(studentId, reportType);
        }

        // 生成AI洞察
        const aiInsights = await generateReportInsights(studentId, report);

        res.json({
            studentId,
            reportType,
            report: report,
            insights: aiInsights,
            generatedAt: new Date(),
            nextReportDate: calculateNextReportDate(reportType)
        });

    } catch (error) {
        console.error('获取学习报告错误:', error);
        res.status(500).json({
            message: '获取学习报告失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 获取学习统计数据
 */
const getLearningStatisticsData = async (studentId, startDate) => {
    const answers = await Answer.find({
        student: studentId,
        submitTime: { $gte: startDate }
    });

    return {
        totalQuestions: answers.length,
        correctAnswers: answers.filter(a => a.isCorrect).length,
        averageScore: answers.length > 0 ? 
            answers.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / answers.length * 100 : 0,
        totalTimeSpent: answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0),
        subjectsStudied: [...new Set(answers.map(a => a.subject))].length,
        dailyActivity: groupAnswersByDay(answers)
    };
};

/**
 * 获取练习统计数据
 */
const getPracticeStatistics = async (studentId, startDate) => {
    const practices = await PracticeRecord.find({
        student: studentId,
        startTime: { $gte: startDate }
    });

    return {
        totalSessions: practices.length,
        completedSessions: practices.filter(p => p.status === 'completed').length,
        averageScore: practices.length > 0 ?
            practices.reduce((sum, p) => sum + (p.percentage || 0), 0) / practices.length : 0,
        totalPracticeTime: practices.reduce((sum, p) => sum + (p.totalTime || 0), 0),
        averageSessionTime: practices.length > 0 ?
            practices.reduce((sum, p) => sum + (p.totalTime || 0), 0) / practices.length : 0,
        practiceFrequency: calculatePracticeFrequency(practices)
    };
};

/**
 * 获取表现统计数据
 */
const getPerformanceStatistics = async (studentId, startDate) => {
    const answers = await Answer.find({
        student: studentId,
        submitTime: { $gte: startDate }
    }).populate('question', 'difficulty knowledgePoints');

    // 按难度分析
    const difficultyStats = analyzeDifficultyPerformance(answers);

    // 按知识点分析
    const knowledgePointStats = analyzeKnowledgePointPerformance(answers);

    return {
        overallAccuracy: answers.length > 0 ?
            (answers.filter(a => a.isCorrect).length / answers.length) * 100 : 0,
        difficultyBreakdown: difficultyStats,
        knowledgePointMastery: knowledgePointStats,
        improvementTrend: calculateImprovementTrend(answers),
        consistencyScore: calculateConsistencyScore(answers)
    };
};

/**
 * 获取即将到来的任务
 */
const getUpcomingTasks = async (studentId) => {
    const upcomingExams = await Exam.find({
        startTime: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }).populate('subject', 'subName');

    return {
        exams: upcomingExams.map(exam => ({
            id: exam._id,
            title: exam.title,
            subject: exam.subject.subName,
            date: exam.startTime,
            duration: exam.duration,
            status: 'upcoming'
        })),
        assignments: [], // 可以添加作业数据
        reminders: [
            '完成今日练习',
            '复习昨天的错题',
            '预习明天的课程'
        ]
    };
};

/**
 * 获取最近成就
 */
const getRecentAchievements = async (studentId) => {
    // 简化实现，实际应该从成就系统获取
    return [
        {
            id: 1,
            title: '连续学习7天',
            description: '保持了一周的学习习惯',
            earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            type: 'streak',
            icon: '🔥'
        },
        {
            id: 2,
            title: '数学小能手',
            description: '数学练习准确率达到90%',
            earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            type: 'performance',
            icon: '🏆'
        }
    ];
};

/**
 * 生成学习洞察
 */
const generateLearningInsights = async (studentId, startDate) => {
    const answers = await Answer.find({
        student: studentId,
        submitTime: { $gte: startDate }
    });

    const insights = [];

    // 学习频率洞察
    const dailyActivity = groupAnswersByDay(answers);
    const activeDays = Object.keys(dailyActivity).length;
    const totalDays = Math.ceil((new Date() - startDate) / (24 * 60 * 60 * 1000));
    
    if (activeDays / totalDays >= 0.8) {
        insights.push({
            type: 'positive',
            title: '学习习惯优秀',
            description: `在过去${totalDays}天中，你有${activeDays}天进行了学习，保持了很好的学习节奏！`,
            actionable: false
        });
    } else if (activeDays / totalDays < 0.5) {
        insights.push({
            type: 'improvement',
            title: '建议增加学习频率',
            description: '尝试每天至少完成一些练习，保持学习的连续性',
            actionable: true,
            action: '设置每日学习提醒'
        });
    }

    // 准确率洞察
    const accuracy = answers.length > 0 ? 
        (answers.filter(a => a.isCorrect).length / answers.length) * 100 : 0;
    
    if (accuracy >= 85) {
        insights.push({
            type: 'positive',
            title: '答题准确率很高',
            description: `当前准确率为${accuracy.toFixed(1)}%，表现优秀！`,
            actionable: true,
            action: '可以尝试更有挑战性的题目'
        });
    } else if (accuracy < 60) {
        insights.push({
            type: 'improvement',
            title: '需要加强基础练习',
            description: '建议多做基础题目，巩固基本概念',
            actionable: true,
            action: '开始基础强化练习'
        });
    }

    return insights;
};

/**
 * 计算学习指标
 */
const calculateLearningMetrics = (data) => {
    const { learningStats, practiceStats, performanceStats } = data;

    return {
        engagement: {
            score: calculateEngagementScore(learningStats, practiceStats),
            level: 'high', // high, medium, low
            trend: 'improving'
        },
        efficiency: {
            score: calculateEfficiencyScore(learningStats, performanceStats),
            timePerQuestion: learningStats.totalQuestions > 0 ? 
                learningStats.totalTimeSpent / learningStats.totalQuestions : 0,
            accuracyRate: performanceStats.overallAccuracy
        },
        consistency: {
            score: calculateConsistencyScore(learningStats.dailyActivity),
            streak: calculateCurrentStreak(learningStats.dailyActivity),
            pattern: 'regular' // regular, irregular, improving
        },
        progress: {
            score: calculateProgressScore(performanceStats),
            trend: performanceStats.improvementTrend,
            velocity: 'normal' // fast, normal, slow
        }
    };
};

// 其他辅助函数的简化实现
const generatePersonalizedSuggestions = async (studentId, data) => {
    return [
        {
            type: 'study_method',
            priority: 'high',
            title: '学习方法建议',
            description: '基于你的学习模式，建议采用间隔重复学习法'
        },
        {
            type: 'practice',
            priority: 'medium',
            title: '练习建议',
            description: '增加薄弱知识点的练习频率'
        }
    ];
};

const getStudentGoals = async (studentId) => {
    return [
        {
            id: 1,
            title: '提升数学成绩',
            description: '在下次考试中达到85分以上',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            type: 'academic'
        }
    ];
};

const calculateGoalProgress = async (studentId, goal) => {
    return {
        percentage: 65,
        completedTasks: 13,
        totalTasks: 20,
        milestones: [
            { name: '基础练习', completed: true },
            { name: '进阶练习', completed: false }
        ]
    };
};

const determineGoalStatus = (progress, deadline) => {
    if (progress.percentage >= 100) return 'completed';
    if (new Date() > deadline) return 'overdue';
    return 'in_progress';
};

const getNextMilestone = (goal, progress) => {
    const incompleteMilestone = progress.milestones.find(m => !m.completed);
    return incompleteMilestone ? incompleteMilestone.name : '目标完成';
};

const generateGoalSuggestions = async (studentId, goals) => {
    return [
        '建议每天完成2-3道练习题',
        '重点复习错题和薄弱知识点',
        '保持学习节奏，避免临时抱佛脚'
    ];
};

// 数据分析辅助函数
const groupAnswersByDay = (answers) => {
    const grouped = {};
    answers.forEach(answer => {
        const day = answer.submitTime.toDateString();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(answer);
    });
    return grouped;
};

const analyzeDifficultyPerformance = (answers) => {
    const difficulties = ['easy', 'medium', 'hard'];
    return difficulties.map(diff => {
        const diffAnswers = answers.filter(a => a.question?.difficulty === diff);
        return {
            difficulty: diff,
            total: diffAnswers.length,
            correct: diffAnswers.filter(a => a.isCorrect).length,
            accuracy: diffAnswers.length > 0 ? 
                (diffAnswers.filter(a => a.isCorrect).length / diffAnswers.length) * 100 : 0
        };
    });
};

const analyzeKnowledgePointPerformance = (answers) => {
    const knowledgePoints = {};
    answers.forEach(answer => {
        if (answer.question?.knowledgePoints) {
            answer.question.knowledgePoints.forEach(kp => {
                if (!knowledgePoints[kp]) {
                    knowledgePoints[kp] = { total: 0, correct: 0 };
                }
                knowledgePoints[kp].total++;
                if (answer.isCorrect) knowledgePoints[kp].correct++;
            });
        }
    });

    return Object.entries(knowledgePoints).map(([kp, stats]) => ({
        knowledgePoint: kp,
        total: stats.total,
        correct: stats.correct,
        mastery: (stats.correct / stats.total) * 100
    }));
};

const calculateImprovementTrend = (answers) => {
    if (answers.length < 10) return 'insufficient_data';
    
    const recent = answers.slice(-10);
    const earlier = answers.slice(-20, -10);
    
    const recentAccuracy = recent.filter(a => a.isCorrect).length / recent.length;
    const earlierAccuracy = earlier.filter(a => a.isCorrect).length / earlier.length;
    
    if (recentAccuracy > earlierAccuracy + 0.1) return 'improving';
    if (recentAccuracy < earlierAccuracy - 0.1) return 'declining';
    return 'stable';
};

const calculateConsistencyScore = (answers) => {
    // 简化实现：基于答题时间的一致性
    return 75;
};

const calculatePracticeFrequency = (practices) => {
    if (practices.length === 0) return 0;
    
    const days = new Set(practices.map(p => p.startTime.toDateString())).size;
    const totalDays = Math.ceil((new Date() - practices[practices.length - 1].startTime) / (24 * 60 * 60 * 1000));
    
    return (days / totalDays) * 100;
};

const calculateEngagementScore = (learningStats, practiceStats) => {
    const questionScore = Math.min(learningStats.totalQuestions / 50, 1) * 40;
    const practiceScore = Math.min(practiceStats.totalSessions / 10, 1) * 30;
    const timeScore = Math.min(learningStats.totalTimeSpent / 3600, 1) * 30;
    
    return questionScore + practiceScore + timeScore;
};

const calculateEfficiencyScore = (learningStats, performanceStats) => {
    const accuracyScore = performanceStats.overallAccuracy * 0.7;
    const speedScore = learningStats.totalQuestions > 0 ? 
        Math.min(learningStats.totalQuestions / (learningStats.totalTimeSpent / 60), 2) * 15 : 0;
    
    return accuracyScore + speedScore;
};

const calculateCurrentStreak = (dailyActivity) => {
    const days = Object.keys(dailyActivity).sort().reverse();
    let streak = 0;
    const today = new Date().toDateString();
    
    for (const day of days) {
        if (day === today || streak > 0) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
};

const calculateProgressScore = (performanceStats) => {
    return performanceStats.overallAccuracy;
};

module.exports = {
    getStudentDashboard,
    getLearningGoalsProgress,
    getPersonalizedSuggestions,
    getLearningStatistics,
    getLearningReport
};
