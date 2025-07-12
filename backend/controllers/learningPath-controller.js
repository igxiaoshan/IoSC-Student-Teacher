const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Answer = require('../models/answerSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 生成个性化学习路径
 */
const generateLearningPath = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, learningGoals, timeframe, preferences } = req.body;

        // 验证学生
        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('school', 'schoolName');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生完整学习档案
        const studentData = await getComprehensiveStudentData(studentId, subject);

        // 获取课程体系信息
        const curriculum = await getCurriculumStructure(subject, student.sclassName._id);

        // 调用AI服务生成学习路径
        const pathData = {
            studentId,
            currentLevel: studentData.currentLevel,
            strengths: studentData.strengths,
            weaknesses: studentData.weaknesses,
            learningHistory: studentData.learningHistory,
            learningStyle: studentData.learningStyle,
            availableTime: timeframe,
            goals: learningGoals
        };

        const aiResult = await aiService.planLearningPath(pathData, curriculum);

        let learningPath;
        if (aiResult.success) {
            const parsed = AIResponseParser.parseLearningPathResponse(aiResult.answer);
            if (parsed.success) {
                learningPath = parsed.learningPath;
            } else {
                learningPath = await generateBasicLearningPath(studentData, curriculum);
            }
        } else {
            learningPath = await generateBasicLearningPath(studentData, curriculum);
        }

        // 保存学习路径
        const pathRecord = {
            studentId,
            subject,
            learningPath,
            generatedAt: new Date(),
            status: 'active',
            progress: 0,
            aiGenerated: aiResult.success
        };

        res.json({
            message: '学习路径生成成功',
            data: {
                student: {
                    id: student._id,
                    name: student.name,
                    class: student.sclassName.sclassName,
                    currentLevel: studentData.currentLevel
                },
                learningPath: pathRecord,
                estimatedCompletion: calculateEstimatedCompletion(learningPath, timeframe),
                nextSteps: getNextSteps(learningPath),
                aiGenerated: aiResult.success
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

        // 获取当前学习路径
        const currentPath = await getCurrentLearningPath(studentId, subject);
        
        if (!currentPath) {
            return res.status(404).json({ message: '未找到活跃的学习路径' });
        }

        // 计算进度
        const progress = await calculateLearningProgress(studentId, currentPath);

        // 分析学习效果
        const effectiveness = await analyzeLearningEffectiveness(studentId, currentPath);

        // 生成调整建议
        const adjustmentSuggestions = await generatePathAdjustments(progress, effectiveness);

        res.json({
            studentId,
            subject,
            currentPath: currentPath,
            progress: progress,
            effectiveness: effectiveness,
            adjustmentSuggestions: adjustmentSuggestions,
            lastUpdated: new Date()
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

        // 获取当前路径
        const currentPath = await getCurrentLearningPath(studentId);
        if (!currentPath) {
            return res.status(404).json({ message: '学习路径不存在' });
        }

        // 应用更新
        const updatedPath = await applyPathUpdates(currentPath, updates, reason);

        // 记录更新历史
        await recordPathUpdate(studentId, {
            oldPath: currentPath,
            newPath: updatedPath,
            reason: reason,
            updatedAt: new Date()
        });

        res.json({
            message: '学习路径更新成功',
            data: {
                updatedPath: updatedPath,
                changes: updates,
                reason: reason,
                updatedAt: new Date()
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
        const { context, urgency } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生当前状态
        const studentState = await getCurrentStudentState(studentId);

        // 生成个性化建议
        const recommendations = await generatePersonalizedRecommendations(studentState, {
            context: context || 'general',
            urgency: urgency || 'normal'
        });

        res.json({
            studentId,
            recommendations: recommendations,
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

        // 构建个性化知识图谱
        const knowledgeMap = await buildPersonalizedKnowledgeMap(studentId, subject);

        // 标记掌握状态
        const masteryMap = await getMasteryStatus(studentId, knowledgeMap);

        // 生成学习路径可视化
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
        const { activityType, content, duration, outcome } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 记录学习活动
        const activity = {
            studentId,
            type: activityType,
            content: content,
            duration: duration,
            outcome: outcome,
            timestamp: new Date()
        };

        await saveActivityRecord(activity);

        // 更新学习路径进度
        await updatePathProgress(studentId, activity);

        // 触发自适应调整
        const adaptiveAdjustments = await triggerAdaptiveAdjustments(studentId, activity);

        res.json({
            message: '学习活动记录成功',
            data: {
                activity: activity,
                pathUpdated: adaptiveAdjustments.pathUpdated,
                adjustments: adaptiveAdjustments.adjustments
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

// 辅助函数

/**
 * 获取综合学生数据
 */
const getComprehensiveStudentData = async (studentId, subject) => {
    // 获取答题历史
    const answers = await Answer.find({
        student: studentId,
        submitTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }).populate('question', 'knowledgePoints difficulty type');

    // 获取练习记录
    const practices = await PracticeRecord.find({
        student: studentId,
        status: 'completed',
        endTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    });

    // 分析学习数据
    const currentLevel = analyzeCurrentLevel(answers, practices);
    const strengths = identifyStrengths(answers);
    const weaknesses = identifyWeaknesses(answers);
    const learningHistory = extractLearningHistory(answers, practices);
    const learningStyle = analyzeLearningStyle(practices);

    return {
        currentLevel,
        strengths,
        weaknesses,
        learningHistory,
        learningStyle,
        totalActivities: answers.length + practices.length,
        averagePerformance: calculateAveragePerformance(answers, practices)
    };
};

/**
 * 获取课程体系结构
 */
const getCurriculumStructure = async (subject, classId) => {
    // 获取科目信息
    const subjectInfo = await Subject.findById(subject);
    
    // 获取知识库内容
    const knowledgeBase = await KnowledgeBase.find({
        subject: subject,
        isActive: true
    }).select('title tags');

    // 构建课程体系
    return {
        subject: subjectInfo.subName,
        level: 'intermediate', // 根据班级确定
        modules: extractCurriculumModules(knowledgeBase),
        prerequisites: [],
        learningObjectives: [],
        estimatedDuration: 120 // 小时
    };
};

/**
 * 生成基础学习路径
 */
const generateBasicLearningPath = async (studentData, curriculum) => {
    return {
        phases: [
            {
                id: 1,
                name: '基础巩固',
                description: '巩固基础知识',
                duration: 30,
                topics: studentData.weaknesses.slice(0, 3),
                activities: ['复习', '练习', '测试'],
                resources: []
            },
            {
                id: 2,
                name: '能力提升',
                description: '提升核心能力',
                duration: 60,
                topics: ['核心概念', '应用技能'],
                activities: ['学习', '实践', '项目'],
                resources: []
            },
            {
                id: 3,
                name: '综合应用',
                description: '综合运用知识',
                duration: 30,
                topics: ['综合应用', '创新思维'],
                activities: ['项目实战', '创新练习'],
                resources: []
            }
        ],
        totalDuration: 120,
        difficulty: 'adaptive',
        personalizedElements: {
            focusAreas: studentData.weaknesses,
            strengthAreas: studentData.strengths,
            learningStyle: studentData.learningStyle
        }
    };
};

/**
 * 计算预计完成时间
 */
const calculateEstimatedCompletion = (learningPath, timeframe) => {
    const totalHours = learningPath.totalDuration || 120;
    const weeklyHours = timeframe?.weeklyHours || 10;
    const weeks = Math.ceil(totalHours / weeklyHours);
    
    const startDate = new Date();
    const completionDate = new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    
    return {
        estimatedWeeks: weeks,
        estimatedHours: totalHours,
        startDate: startDate,
        completionDate: completionDate
    };
};

/**
 * 获取下一步行动
 */
const getNextSteps = (learningPath) => {
    if (!learningPath.phases || learningPath.phases.length === 0) {
        return ['开始学习基础知识'];
    }

    const firstPhase = learningPath.phases[0];
    return [
        `开始${firstPhase.name}阶段`,
        `重点学习：${firstPhase.topics.join(', ')}`,
        `建议活动：${firstPhase.activities.join(', ')}`
    ];
};

// 其他辅助函数的简化实现
const getCurrentLearningPath = async (studentId, subject) => {
    // 简化实现：返回模拟数据
    return {
        id: 'path_' + studentId,
        studentId,
        subject,
        status: 'active',
        progress: 25,
        phases: []
    };
};

const calculateLearningProgress = async (studentId, currentPath) => {
    return {
        overallProgress: 25,
        phaseProgress: [
            { phaseId: 1, progress: 80, status: 'completed' },
            { phaseId: 2, progress: 30, status: 'in_progress' },
            { phaseId: 3, progress: 0, status: 'not_started' }
        ],
        completedActivities: 15,
        totalActivities: 60,
        timeSpent: 45,
        estimatedTimeRemaining: 135
    };
};

const analyzeLearningEffectiveness = async (studentId, currentPath) => {
    return {
        effectivenessScore: 75,
        learningVelocity: 'normal',
        retentionRate: 85,
        engagementLevel: 'high',
        adaptationNeeded: false
    };
};

const generatePathAdjustments = async (progress, effectiveness) => {
    return [
        {
            type: 'pace_adjustment',
            suggestion: '可以适当加快学习节奏',
            reason: '当前进度良好，理解能力强'
        }
    ];
};

const applyPathUpdates = async (currentPath, updates, reason) => {
    return { ...currentPath, ...updates, lastUpdated: new Date() };
};

const recordPathUpdate = async (studentId, updateRecord) => {
    console.log('记录路径更新:', updateRecord);
};

const getCurrentStudentState = async (studentId) => {
    return {
        currentLevel: 'intermediate',
        recentPerformance: 'good',
        motivationLevel: 'high',
        availableTime: 'normal'
    };
};

const generatePersonalizedRecommendations = async (studentState, options) => {
    return [
        {
            type: 'study_method',
            title: '学习方法建议',
            description: '建议采用间隔重复学习法',
            priority: 'high'
        },
        {
            type: 'resource',
            title: '学习资源推荐',
            description: '推荐相关视频教程',
            priority: 'medium'
        }
    ];
};

const buildPersonalizedKnowledgeMap = async (studentId, subject) => {
    return {
        nodes: [
            { id: 'basic_concepts', name: '基础概念', level: 1 },
            { id: 'advanced_topics', name: '高级主题', level: 2 }
        ],
        edges: [
            { from: 'basic_concepts', to: 'advanced_topics', type: 'prerequisite' }
        ]
    };
};

const getMasteryStatus = async (studentId, knowledgeMap) => {
    return {
        'basic_concepts': { mastery: 80, status: 'mastered' },
        'advanced_topics': { mastery: 30, status: 'learning' }
    };
};

const generatePathVisualization = async (knowledgeMap, masteryMap) => {
    return {
        type: 'tree',
        layout: 'hierarchical',
        data: knowledgeMap
    };
};

const saveActivityRecord = async (activity) => {
    console.log('保存学习活动:', activity);
};

const updatePathProgress = async (studentId, activity) => {
    console.log('更新路径进度:', studentId, activity.type);
};

const triggerAdaptiveAdjustments = async (studentId, activity) => {
    return {
        pathUpdated: false,
        adjustments: []
    };
};

// 数据分析辅助函数
const analyzeCurrentLevel = (answers, practices) => {
    const avgScore = answers.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / answers.length || 0;
    if (avgScore >= 0.8) return 'advanced';
    if (avgScore >= 0.6) return 'intermediate';
    return 'beginner';
};

const identifyStrengths = (answers) => {
    const correctAnswers = answers.filter(a => a.isCorrect);
    const knowledgePoints = correctAnswers.flatMap(a => a.question?.knowledgePoints || []);
    return [...new Set(knowledgePoints)].slice(0, 5);
};

const identifyWeaknesses = (answers) => {
    const wrongAnswers = answers.filter(a => !a.isCorrect);
    const knowledgePoints = wrongAnswers.flatMap(a => a.question?.knowledgePoints || []);
    return [...new Set(knowledgePoints)].slice(0, 5);
};

const extractLearningHistory = (answers, practices) => {
    return {
        totalActivities: answers.length + practices.length,
        recentTopics: [...new Set(answers.flatMap(a => a.question?.knowledgePoints || []))].slice(0, 10),
        studyPattern: 'regular'
    };
};

const analyzeLearningStyle = (practices) => {
    return 'visual'; // 简化实现
};

const calculateAveragePerformance = (answers, practices) => {
    const answerPerf = answers.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / answers.length || 0;
    const practicePerf = practices.reduce((sum, p) => sum + p.percentage, 0) / practices.length || 0;
    return (answerPerf + practicePerf) / 2;
};

const extractCurriculumModules = (knowledgeBase) => {
    return knowledgeBase.map(kb => ({
        name: kb.title,
        topics: kb.tags || []
    }));
};

module.exports = {
    generateLearningPath,
    getLearningPathProgress,
    updateLearningPath,
    getLearningRecommendations,
    getKnowledgeMap,
    recordLearningActivity
};
