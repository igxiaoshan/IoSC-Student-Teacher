const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Answer = require('../models/answerSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const LearningPath = require('../models/learningPathSchema');
const aiService = require('../services/aiService');
const learningPathService = require('../services/learningPathService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 生成个性化学习路径
 */
const generateLearningPath = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, learningGoals, timeframe, preferences, useAI = true } = req.body;

        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('school', 'schoolName');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        let existingPath = await LearningPath.findActiveByStudentSubject(studentId, subject);
        if (existingPath) {
            existingPath.status = 'archived';
            await existingPath.save();
        }

        const learningPath = await learningPathService.createLearningPath(studentId, subject, {
            learningGoals,
            timeframe,
            preferences,
            useAI
        });

        const populatedPath = await LearningPath.findById(learningPath._id)
            .populate('subject', 'subName subCode');

        res.json({
            message: '学习路径生成成功',
            data: {
                student: {
                    id: student._id,
                    name: student.name,
                    class: student.sclassName.sclassName
                },
                learningPath: populatedPath,
                generatedAt: learningPath.generatedAt,
                aiGenerated: learningPath.aiGenerated
            }
        });

    } catch (error) {
        console.error('生成学习路径错误:', error);
        res.status(500).json({
            message: '生成学习路径失败',
            error: error.message
        });
    }
};

/**
 * 获取学习路径进度
 */
const getLearningPathProgress = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const currentPath = await LearningPath.findActiveByStudentSubject(studentId, subject);

        if (!currentPath) {
            return res.status(404).json({ message: '未找到活跃的学习路径' });
        }

        const progress = await calculateLearningProgress(studentId, currentPath);
        const effectiveness = await analyzeLearningEffectiveness(studentId, currentPath);
        const adjustmentSuggestions = await generatePathAdjustments(progress, effectiveness);

        res.json({
            studentId,
            subject,
            currentPath: currentPath,
            progress: progress,
            effectiveness: effectiveness,
            adjustmentSuggestions: adjustmentSuggestions,
            lastUpdated: currentPath.lastUpdated
        });

    } catch (error) {
        console.error('获取学习路径进度错误:', error);
        res.status(500).json({
            message: '获取学习路径进度失败',
            error: error.message
        });
    }
};

/**
 * 更新学习路径
 */
const updateLearningPath = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { pathId, updates, reason } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const currentPath = await LearningPath.findById(pathId);
        if (!currentPath || currentPath.student.toString() !== studentId) {
            return res.status(404).json({ message: '学习路径不存在' });
        }

        const previousState = {
            phases: currentPath.phases,
            personalizedElements: currentPath.personalizedElements,
            progress: currentPath.progress
        };

        Object.keys(updates).forEach(key => {
            if (['phases', 'personalizedElements', 'totalDuration'].includes(key)) {
                currentPath[key] = updates[key];
            }
        });

        currentPath.progress = currentPath.calculateProgress();
        currentPath.lastUpdated = new Date();

        currentPath.updateHistory.push({
            updatedAt: new Date(),
            updateType: 'manual',
            reason: reason || '用户手动更新',
            previousState,
            newState: { phases: currentPath.phases, progress: currentPath.progress }
        });

        await currentPath.save();

        res.json({
            message: '学习路径更新成功',
            data: {
                updatedPath: currentPath,
                changes: updates,
                reason: reason,
                updatedAt: currentPath.lastUpdated
            }
        });

    } catch (error) {
        console.error('更新学习路径错误:', error);
        res.status(500).json({
            message: '更新学习路径失败',
            error: error.message
        });
    }
};

/**
 * 获取学习建议
 */
const getLearningRecommendations = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, context, urgency, useAI = true } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const features = await learningPathService.extractStudentFeatures(studentId, subject);

        let recommendations = await learningPathService.generateRuleBasedRecommendations(features, {
            context: context || 'general',
            urgency: urgency || 'normal'
        });

        if (useAI === 'true' || useAI === true) {
            const subjectInfo = await Subject.findById(subject);
            const aiResult = await learningPathService.enhanceWithAI(features, recommendations, {
                subjectName: subjectInfo?.subName,
                context,
                urgency
            });

            if (aiResult.enhanced) {
                recommendations = aiResult.recommendations;
            }
        }

        res.json({
            studentId,
            subject,
            recommendations: recommendations,
            studentFeatures: {
                performance: features.performance,
                engagement: features.engagement,
                learningStyle: features.learningStyle,
                trend: features.recentTrend
            },
            context: context,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取学习建议错误:', error);
        res.status(500).json({
            message: '获取学习建议失败',
            error: error.message
        });
    }
};

/**
 * 获取知识图谱
 */
const getKnowledgeMap = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const knowledgeMap = await buildPersonalizedKnowledgeMap(studentId, subject);
        const masteryMap = await getMasteryStatus(studentId, knowledgeMap);
        const pathVisualization = await generatePathVisualization(knowledgeMap, masteryMap);

        res.json({
            studentId,
            subject,
            knowledgeMap: knowledgeMap,
            masteryStatus: masteryMap,
            visualization: pathVisualization,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取知识图谱错误:', error);
        res.status(500).json({
            message: '获取知识图谱失败',
            error: error.message
        });
    }
};

/**
 * 记录学习活动
 */
const recordLearningActivity = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, activityType, content, duration, outcome, score, phaseId, notes } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const activity = {
            date: new Date(),
            activityType,
            content,
            duration,
            outcome,
            score,
            phaseId,
            notes
        };

        let currentPath = await LearningPath.findActiveByStudentSubject(studentId, subject);

        if (!currentPath) {
            currentPath = await learningPathService.createLearningPath(studentId, subject);
        }

        await currentPath.addActivity(activity);

        const adaptiveAdjustments = await triggerAdaptiveAdjustments(studentId, currentPath, activity);

        res.json({
            message: '学习活动记录成功',
            data: {
                activity: activity,
                pathUpdated: adaptiveAdjustments.pathUpdated,
                adjustments: adaptiveAdjustments.adjustments,
                currentProgress: currentPath.progress
            }
        });

    } catch (error) {
        console.error('记录学习活动错误:', error);
        res.status(500).json({
            message: '记录学习活动失败',
            error: error.message
        });
    }
};

/**
 * 获取每日推荐
 */
const getDailyRecommendations = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, useAI = true } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const dailyRecommendations = await learningPathService.generateDailyRecommendations(
            studentId,
            subject,
            { useAI: useAI === 'true' || useAI === true }
        );

        res.json({
            studentId,
            subject,
            ...dailyRecommendations
        });

    } catch (error) {
        console.error('获取每日推荐错误:', error);
        res.status(500).json({
            message: '获取每日推荐失败',
            error: error.message
        });
    }
};

/**
 * 获取学生所有学习路径
 */
const getStudentLearningPaths = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { status } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const query = { student: studentId };
        if (status) query.status = status;

        const paths = await LearningPath.find(query)
            .populate('subject', 'subName subCode')
            .sort({ lastUpdated: -1 });

        res.json({
            studentId,
            paths: paths.map(p => ({
                id: p._id,
                subject: p.subject,
                status: p.status,
                progress: p.progress,
                totalDuration: p.totalDuration,
                aiGenerated: p.aiGenerated,
                generatedAt: p.generatedAt,
                lastUpdated: p.lastUpdated,
                currentPhase: p.getCurrentPhase()
            }))
        });

    } catch (error) {
        console.error('获取学习路径列表错误:', error);
        res.status(500).json({
            message: '获取学习路径列表失败',
            error: error.message
        });
    }
};

/**
 * 暂停/恢复学习路径
 */
const toggleLearningPathStatus = async (req, res) => {
    try {
        const { studentId, pathId } = req.params;
        const { action } = req.body;

        const path = await LearningPath.findById(pathId);
        if (!path || path.student.toString() !== studentId) {
            return res.status(404).json({ message: '学习路径不存在' });
        }

        if (action === 'pause') {
            path.status = 'paused';
        } else if (action === 'resume') {
            path.status = 'active';
        } else if (action === 'complete') {
            path.status = 'completed';
            path.progress = 100;
        }

        path.lastUpdated = new Date();
        await path.save();

        res.json({
            message: `学习路径已${action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '完成'}`,
            data: {
                pathId: path._id,
                status: path.status,
                progress: path.progress
            }
        });

    } catch (error) {
        console.error('切换学习路径状态错误:', error);
        res.status(500).json({
            message: '操作失败',
            error: error.message
        });
    }
};

// ============ 辅助函数 ============

/**
 * 计算学习进度
 */
const calculateLearningProgress = async (studentId, currentPath) => {
    const recentActivities = currentPath.learningActivities.slice(-20);

    const phaseProgress = currentPath.phases.map(phase => {
        const phaseActivities = recentActivities.filter(a => a.phaseId === phase.id);
        const completedCount = phaseActivities.filter(a => a.outcome === 'success').length;
        const totalActivities = phaseActivities.length || 1;

        return {
            phaseId: phase.id,
            name: phase.name,
            progress: Math.round((completedCount / totalActivities) * 100),
            status: phase.status,
            completedActivities: completedCount,
            totalActivities: phaseActivities.length
        };
    });

    const totalTimeSpent = recentActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const estimatedRemaining = Math.max(0, (currentPath.totalDuration * 60) - totalTimeSpent);

    return {
        overallProgress: currentPath.calculateProgress(),
        phaseProgress,
        completedActivities: recentActivities.filter(a => a.outcome === 'success').length,
        totalActivities: recentActivities.length,
        timeSpent: Math.round(totalTimeSpent / 60),
        estimatedTimeRemaining: Math.round(estimatedRemaining / 60)
    };
};

/**
 * 分析学习效果
 */
const analyzeLearningEffectiveness = async (studentId, currentPath) => {
    const activities = currentPath.learningActivities;
    if (activities.length < 5) {
        return {
            effectivenessScore: 50,
            learningVelocity: 'insufficient_data',
            retentionRate: 50,
            engagementLevel: 'unknown',
            adaptationNeeded: false
        };
    }

    const recentActivities = activities.slice(-20);
    const successRate = recentActivities.filter(a => a.outcome === 'success').length / recentActivities.length;

    const avgDuration = recentActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / recentActivities.length;

    const velocity = successRate > 0.7 ? 'fast' : successRate > 0.5 ? 'normal' : 'slow';

    const lastWeekActivities = activities.filter(a => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return a.date >= weekAgo;
    });
    const engagementLevel = lastWeekActivities.length >= 5 ? 'high' :
        lastWeekActivities.length >= 2 ? 'medium' : 'low';

    return {
        effectivenessScore: Math.round(successRate * 100),
        learningVelocity: velocity,
        retentionRate: Math.round((successRate + 0.1) * 100),
        engagementLevel,
        adaptationNeeded: successRate < 0.5 || engagementLevel === 'low'
    };
};

/**
 * 生成路径调整建议
 */
const generatePathAdjustments = async (progress, effectiveness) => {
    const suggestions = [];

    if (effectiveness.learningVelocity === 'slow') {
        suggestions.push({
            type: 'pace_adjustment',
            suggestion: '建议放慢学习节奏，增加复习时间',
            reason: '当前理解速度较慢，需要更多巩固'
        });
    }

    if (effectiveness.engagementLevel === 'low') {
        suggestions.push({
            type: 'engagement_boost',
            suggestion: '尝试更换学习方式或调整学习时段',
            reason: '近期学习活跃度较低'
        });
    }

    if (progress.phaseProgress.some(p => p.progress < 30 && p.status === 'in_progress')) {
        suggestions.push({
            type: 'difficulty_adjustment',
            suggestion: '考虑降低当前阶段难度或补充基础知识',
            reason: '当前阶段进度缓慢'
        });
    }

    return suggestions;
};

/**
 * 构建个性化知识图谱
 */
const buildPersonalizedKnowledgeMap = async (studentId, subject) => {
    const knowledgeBase = await KnowledgeBase.find({
        subject: subject,
        isActive: true
    }).select('title tags');

    const answers = await Answer.find({ student: studentId })
        .populate('question', 'knowledgePoints')
        .lean();

    const knownPoints = new Set();
    answers.forEach(a => {
        if (a.isCorrect && a.question?.knowledgePoints) {
            a.question.knowledgePoints.forEach(p => knownPoints.add(p));
        }
    });

    const nodes = knowledgeBase.map(kb => ({
        id: kb._id,
        name: kb.title,
        tags: kb.tags,
        known: kb.tags?.some(t => knownPoints.has(t)) || false
    }));

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        const commonTags = nodes[i].tags?.filter(t => nodes[i + 1].tags?.includes(t)) || [];
        if (commonTags.length > 0) {
            edges.push({
                from: nodes[i].id,
                to: nodes[i + 1].id,
                type: 'related',
                weight: commonTags.length
            });
        }
    }

    return { nodes, edges };
};

/**
 * 获取掌握状态
 */
const getMasteryStatus = async (studentId, knowledgeMap) => {
    const answers = await Answer.find({ student: studentId })
        .populate('question', 'knowledgePoints')
        .lean();

    const mastery = {};

    knowledgeMap.nodes.forEach(node => {
        const relevantAnswers = answers.filter(a =>
            a.question?.knowledgePoints?.some(p => node.tags?.includes(p))
        );

        if (relevantAnswers.length > 0) {
            const correctRate = relevantAnswers.filter(a => a.isCorrect).length / relevantAnswers.length;
            mastery[node.id] = {
                mastery: Math.round(correctRate * 100),
                status: correctRate >= 0.8 ? 'mastered' : correctRate >= 0.5 ? 'learning' : 'weak',
                attempts: relevantAnswers.length
            };
        } else {
            mastery[node.id] = {
                mastery: 0,
                status: 'unknown',
                attempts: 0
            };
        }
    });

    return mastery;
};

/**
 * 生成路径可视化数据
 */
const generatePathVisualization = async (knowledgeMap, masteryMap) => {
    const nodes = knowledgeMap.nodes.map(node => ({
        id: node.id,
        label: node.name,
        group: masteryMap[node.id]?.status || 'unknown',
        value: masteryMap[node.id]?.mastery || 0
    }));

    const edges = knowledgeMap.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        value: edge.weight
    }));

    return {
        type: 'network',
        layout: 'hierarchical',
        data: { nodes, edges }
    };
};

/**
 * 触发自适应调整
 */
const triggerAdaptiveAdjustments = async (studentId, currentPath, activity) => {
    const adjustments = [];
    let pathUpdated = false;

    if (activity.outcome === 'failed' && activity.score < 50) {
        adjustments.push({
            type: 'add_review',
            message: '建议增加相关知识点复习',
            priority: 'high'
        });
    }

    if (activity.outcome === 'success' && activity.score >= 90) {
        adjustments.push({
            type: 'advance',
            message: '表现优秀，可以考虑进入下一阶段',
            priority: 'medium'
        });
    }

    const recentActivities = currentPath.learningActivities.slice(-5);
    const failCount = recentActivities.filter(a => a.outcome === 'failed').length;

    if (failCount >= 3) {
        adjustments.push({
            type: 'difficulty_decrease',
            message: '连续多次失败，建议降低难度',
            priority: 'high'
        });

        if (currentPath.personalizedElements.difficulty !== 'beginner') {
            const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
            const currentIndex = difficultyOrder.indexOf(currentPath.personalizedElements.difficulty);
            if (currentIndex > 0) {
                currentPath.personalizedElements.difficulty = difficultyOrder[currentIndex - 1];
                pathUpdated = true;
            }
        }
    }

    if (pathUpdated) {
        currentPath.lastUpdated = new Date();
        await currentPath.save();
    }

    return { pathUpdated, adjustments };
};

module.exports = {
    generateLearningPath,
    getLearningPathProgress,
    updateLearningPath,
    getLearningRecommendations,
    getKnowledgeMap,
    recordLearningActivity,
    getDailyRecommendations,
    getStudentLearningPaths,
    toggleLearningPathStatus
};