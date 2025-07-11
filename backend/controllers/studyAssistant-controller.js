const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const Answer = require('../models/answerSchema');
const Question = require('../models/questionSchema');
const aiService = require('../services/aiService');
const difyService = require('../services/difyService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 智能问答助手
 */
const askQuestion = async (req, res) => {
    try {
        const { studentId, question, subject, context, conversationId } = req.body;

        // 验证学生
        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('school', 'schoolName');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生学习历史和偏好
        const studentProfile = await getStudentProfile(studentId, subject);

        // 构建上下文信息
        const queryContext = {
            userId: studentId,
            userType: 'student',
            subject: subject,
            studentLevel: studentProfile.level,
            currentPage: context?.currentPage,
            sessionData: context?.sessionData,
            learningHistory: studentProfile.recentTopics,
            weakPoints: studentProfile.weakPoints,
            strengths: studentProfile.strengths
        };

        // 调用Dify AI服务
        const aiResult = await difyService.answerStudentQuestion({
            studentId,
            question,
            course: subject,
            progress: studentProfile.progress,
            studentLevel: studentProfile.level,
            context: queryContext,
            conversationId
        });

        if (!aiResult || !aiResult.answer) {
            return res.status(500).json({
                message: 'AI助手暂时不可用',
                error: 'Dify服务响应异常'
            });
        }

        // 记录学习互动
        await recordLearningInteraction(studentId, {
            type: 'question',
            question: question,
            answer: aiResult.answer,
            subject: subject,
            context: queryContext
        });

        // 生成相关推荐
        const recommendations = await generateRecommendations(studentId, question, subject);

        res.json({
            message: 'AI助手回答成功',
            data: {
                answer: aiResult.answer,
                conversationId: aiResult.conversationId,
                confidence: aiResult.confidence || 0.8,
                recommendations: recommendations,
                studentProfile: {
                    level: studentProfile.level,
                    progress: studentProfile.progress
                },
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('智能问答错误:', error);
        res.status(500).json({
            message: '智能问答失败',
            error: error.message
        });
    }
};

/**
 * 获取学习建议
 */
const getStudyGuidance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, topic, difficulty } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生详细档案
        const studentProfile = await getDetailedStudentProfile(studentId, subject);

        // 生成学习指导
        const guidancePrompt = `
作为一名专业的学习顾问，请为以下学生提供个性化学习指导：

学生档案：
- 姓名：${student.name}
- 当前水平：${studentProfile.level}
- 学习目标：${topic || '全面提升'}
- 薄弱知识点：${studentProfile.weakPoints.join(', ')}
- 优势领域：${studentProfile.strengths.join(', ')}
- 最近学习表现：${JSON.stringify(studentProfile.recentPerformance)}
- 学习习惯：${studentProfile.studyHabits}

请提供：
1. 当前学习状态评估
2. 个性化学习建议
3. 学习方法指导
4. 时间安排建议
5. 资源推荐
6. 激励和鼓励

请以JSON格式返回结果。
        `;

        const aiResult = await aiService.queryKnowledgeBase(guidancePrompt, null, {
            type: 'study_guidance',
            studentId: studentId,
            subject: subject
        });

        if (!aiResult.success) {
            return res.status(500).json({
                message: '学习指导生成失败',
                error: aiResult.error
            });
        }

        // 解析AI响应
        let guidance;
        try {
            guidance = JSON.parse(aiResult.answer);
        } catch (parseError) {
            guidance = {
                assessment: aiResult.answer.substring(0, 200),
                suggestions: ['继续保持学习热情', '多做练习巩固知识'],
                methods: ['制定学习计划', '定期复习'],
                schedule: '建议每天学习1-2小时',
                resources: [],
                encouragement: '相信自己，持续努力！'
            };
        }

        // 记录学习指导
        await recordLearningInteraction(studentId, {
            type: 'guidance',
            guidance: guidance,
            subject: subject,
            requestedTopic: topic
        });

        res.json({
            message: '学习指导生成成功',
            data: {
                guidance: guidance,
                studentProfile: studentProfile,
                generatedAt: new Date(),
                aiGenerated: true
            }
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
 * 获取学习进度
 */
const getStudyProgress = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, timeRange = 'month' } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

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

        // 获取学习数据
        const progressData = await calculateStudyProgress(studentId, subject, startDate);

        // 生成进度分析
        const progressAnalysis = await analyzeStudyProgress(progressData);

        res.json({
            studentId,
            subject,
            timeRange,
            progress: progressData,
            analysis: progressAnalysis,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('获取学习进度错误:', error);
        res.status(500).json({
            message: '获取学习进度失败',
            error: error.message
        });
    }
};

/**
 * 获取知识点掌握情况
 */
const getKnowledgeMastery = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 分析知识点掌握情况
        const masteryData = await analyzeKnowledgeMastery(studentId, subject);

        // 生成学习路径建议
        const learningPath = await generateLearningPath(studentId, masteryData);

        res.json({
            studentId,
            subject,
            knowledgeMastery: masteryData,
            learningPath: learningPath,
            analysisDate: new Date()
        });

    } catch (error) {
        console.error('获取知识点掌握情况错误:', error);
        res.status(500).json({
            message: '获取知识点掌握情况失败',
            error: error.message
        });
    }
};

/**
 * 获取学习资源推荐
 */
const getResourceRecommendations = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, topic, type } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生档案
        const studentProfile = await getStudentProfile(studentId, subject);

        // 基于学生特点推荐资源
        const recommendations = await recommendLearningResources(studentProfile, {
            subject,
            topic,
            type,
            studentLevel: studentProfile.level,
            weakPoints: studentProfile.weakPoints,
            learningStyle: studentProfile.learningStyle
        });

        res.json({
            studentId,
            subject,
            topic,
            recommendations: recommendations,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('获取学习资源推荐错误:', error);
        res.status(500).json({
            message: '获取学习资源推荐失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 获取学生档案
 */
const getStudentProfile = async (studentId, subject) => {
    // 获取最近的答题记录
    const recentAnswers = await Answer.find({
        student: studentId,
        submitTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
    .populate('question', 'knowledgePoints difficulty type')
    .sort({ submitTime: -1 })
    .limit(50);

    // 分析学习水平
    const level = calculateStudentLevel(recentAnswers);

    // 识别薄弱知识点
    const weakPoints = identifyWeakPoints(recentAnswers);

    // 识别优势领域
    const strengths = identifyStrengths(recentAnswers);

    // 获取最近学习主题
    const recentTopics = extractRecentTopics(recentAnswers);

    return {
        level,
        weakPoints,
        strengths,
        recentTopics,
        progress: calculateProgress(recentAnswers),
        recentPerformance: calculateRecentPerformance(recentAnswers)
    };
};

/**
 * 获取详细学生档案
 */
const getDetailedStudentProfile = async (studentId, subject) => {
    const basicProfile = await getStudentProfile(studentId, subject);
    
    // 添加学习习惯分析
    const studyHabits = await analyzeStudyHabits(studentId);
    
    // 添加学习风格分析
    const learningStyle = await analyzeLearningStyle(studentId);

    return {
        ...basicProfile,
        studyHabits,
        learningStyle
    };
};

/**
 * 记录学习互动
 */
const recordLearningInteraction = async (studentId, interaction) => {
    // 这里可以记录到数据库或日志系统
    console.log(`学习互动记录 - 学生${studentId}:`, interaction);
};

/**
 * 生成推荐
 */
const generateRecommendations = async (studentId, question, subject) => {
    // 基于问题内容和学生档案生成相关推荐
    return [
        {
            type: 'related_topic',
            title: '相关知识点',
            items: ['相关概念1', '相关概念2']
        },
        {
            type: 'practice',
            title: '推荐练习',
            items: ['练习题1', '练习题2']
        }
    ];
};

/**
 * 计算学习进度
 */
const calculateStudyProgress = async (studentId, subject, startDate) => {
    const answers = await Answer.find({
        student: studentId,
        submitTime: { $gte: startDate }
    }).populate('question', 'knowledgePoints difficulty');

    return {
        totalQuestions: answers.length,
        correctAnswers: answers.filter(a => a.isCorrect).length,
        averageScore: answers.reduce((sum, a) => sum + a.score, 0) / answers.length || 0,
        timeSpent: answers.reduce((sum, a) => sum + a.timeSpent, 0),
        topicsStudied: [...new Set(answers.flatMap(a => a.question.knowledgePoints))],
        dailyProgress: groupByDay(answers)
    };
};

/**
 * 分析学习进度
 */
const analyzeStudyProgress = async (progressData) => {
    return {
        overallTrend: progressData.correctAnswers / progressData.totalQuestions > 0.7 ? 'improving' : 'needs_attention',
        strengths: ['基础概念理解'],
        improvements: ['练习量可以增加'],
        nextSteps: ['重点复习薄弱知识点']
    };
};

// 其他辅助函数的简化实现
const calculateStudentLevel = (answers) => {
    const avgScore = answers.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / answers.length || 0;
    if (avgScore >= 0.8) return 'advanced';
    if (avgScore >= 0.6) return 'intermediate';
    return 'beginner';
};

const identifyWeakPoints = (answers) => {
    const wrongAnswers = answers.filter(a => !a.isCorrect);
    const knowledgePoints = wrongAnswers.flatMap(a => a.question?.knowledgePoints || []);
    return [...new Set(knowledgePoints)].slice(0, 5);
};

const identifyStrengths = (answers) => {
    const correctAnswers = answers.filter(a => a.isCorrect);
    const knowledgePoints = correctAnswers.flatMap(a => a.question?.knowledgePoints || []);
    return [...new Set(knowledgePoints)].slice(0, 5);
};

const extractRecentTopics = (answers) => {
    return [...new Set(answers.flatMap(a => a.question?.knowledgePoints || []))].slice(0, 10);
};

const calculateProgress = (answers) => {
    return answers.length > 0 ? (answers.filter(a => a.isCorrect).length / answers.length) * 100 : 0;
};

const calculateRecentPerformance = (answers) => {
    const recent = answers.slice(0, 10);
    return {
        averageScore: recent.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / recent.length || 0,
        trend: 'stable'
    };
};

const analyzeStudyHabits = async (studentId) => {
    return '规律学习，偏好晚上时间';
};

const analyzeLearningStyle = async (studentId) => {
    return 'visual'; // visual, auditory, kinesthetic
};

const analyzeKnowledgeMastery = async (studentId, subject) => {
    return [];
};

const generateLearningPath = async (studentId, masteryData) => {
    return [];
};

const recommendLearningResources = async (studentProfile, criteria) => {
    return [];
};

const groupByDay = (answers) => {
    return {};
};

module.exports = {
    askQuestion,
    getStudyGuidance,
    getStudyProgress,
    getKnowledgeMastery,
    getResourceRecommendations
};
