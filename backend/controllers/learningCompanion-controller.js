const Student = require('../models/studentSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const Answer = require('../models/answerSchema');
const aiService = require('../services/aiService');

/**
 * 获取学习伙伴状态
 */
const getCompanionStatus = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学习伙伴状态
        const companionState = await getCompanionState(studentId);

        // 获取今日学习情况
        const todayProgress = await getTodayProgress(studentId);

        // 生成个性化问候
        const greeting = await generatePersonalizedGreeting(student, todayProgress);

        // 获取学习提醒
        const reminders = await getLearningReminders(studentId);

        // 获取激励信息
        const motivation = await getMotivationalContent(studentId);

        res.json({
            studentId,
            companion: {
                name: companionState.name,
                mood: companionState.mood,
                level: companionState.level,
                avatar: companionState.avatar
            },
            greeting: greeting,
            todayProgress: todayProgress,
            reminders: reminders,
            motivation: motivation,
            lastInteraction: new Date()
        });

    } catch (error) {
        console.error('获取学习伙伴状态错误:', error);
        res.status(500).json({
            message: '获取学习伙伴状态失败',
            error: error.message
        });
    }
};

/**
 * 与学习伙伴对话
 */
const chatWithCompanion = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { message, context, conversationId } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生学习状态
        const learningState = await getStudentLearningState(studentId);

        // 构建伙伴对话上下文
        const companionContext = {
            userId: studentId,
            userType: 'student',
            companionRole: 'learning_buddy',
            studentName: student.name,
            learningState: learningState,
            conversationContext: context,
            mood: 'encouraging',
            personality: 'friendly_and_supportive'
        };

        // 调用AI服务进行对话
        const aiResult = await aiService.queryKnowledgeBase(
            message,
            conversationId,
            companionContext
        );

        if (!aiResult.success) {
            return res.status(500).json({
                message: '学习伙伴暂时不可用',
                error: aiResult.error
            });
        }

        // 分析对话内容，提供额外支持
        const additionalSupport = await analyzeConversationForSupport(message, aiResult.answer, learningState);

        // 记录对话
        await recordCompanionInteraction(studentId, {
            type: 'chat',
            userMessage: message,
            companionResponse: aiResult.answer,
            context: companionContext,
            timestamp: new Date()
        });

        res.json({
            message: '对话成功',
            data: {
                response: aiResult.answer,
                conversationId: aiResult.conversationId,
                additionalSupport: additionalSupport,
                companionMood: updateCompanionMood(message, aiResult.answer),
                suggestions: generateConversationSuggestions(learningState)
            }
        });

    } catch (error) {
        console.error('与学习伙伴对话错误:', error);
        res.status(500).json({
            message: '与学习伙伴对话失败',
            error: error.message
        });
    }
};

/**
 * 获取学习鼓励
 */
const getEncouragement = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { situation, mood } = req.query;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生最近表现
        const recentPerformance = await getRecentPerformance(studentId);

        // 生成个性化鼓励
        const encouragement = await generateEncouragement(student, recentPerformance, {
            situation: situation || 'general',
            mood: mood || 'neutral'
        });

        // 记录鼓励互动
        await recordCompanionInteraction(studentId, {
            type: 'encouragement',
            situation: situation,
            encouragement: encouragement,
            timestamp: new Date()
        });

        res.json({
            studentId,
            encouragement: encouragement,
            companionMessage: encouragement.message,
            actionSuggestions: encouragement.actions,
            motivationalQuote: encouragement.quote
        });

    } catch (error) {
        console.error('获取学习鼓励错误:', error);
        res.status(500).json({
            message: '获取学习鼓励失败',
            error: error.message
        });
    }
};

/**
 * 设置学习目标
 */
const setLearningGoals = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { goals, timeframe, priority } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 分析目标可行性
        const goalAnalysis = await analyzeGoalFeasibility(studentId, goals, timeframe);

        // 生成目标计划
        const goalPlan = await generateGoalPlan(goals, goalAnalysis, timeframe);

        // 设置提醒和检查点
        const checkpoints = await createGoalCheckpoints(goalPlan);

        // 保存目标
        await saveStudentGoals(studentId, {
            goals: goals,
            plan: goalPlan,
            checkpoints: checkpoints,
            createdAt: new Date(),
            status: 'active'
        });

        // 伙伴鼓励
        const companionEncouragement = await generateGoalSettingEncouragement(student.name, goals);

        res.json({
            message: '学习目标设置成功',
            data: {
                goals: goals,
                plan: goalPlan,
                checkpoints: checkpoints,
                analysis: goalAnalysis,
                companionMessage: companionEncouragement
            }
        });

    } catch (error) {
        console.error('设置学习目标错误:', error);
        res.status(500).json({
            message: '设置学习目标失败',
            error: error.message
        });
    }
};

/**
 * 获取学习提醒
 */
const getLearningReminders = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取个性化提醒
        const reminders = await generatePersonalizedReminders(studentId);

        // 获取学习计划提醒
        const scheduleReminders = await getScheduleReminders(studentId);

        // 获取目标进度提醒
        const goalReminders = await getGoalProgressReminders(studentId);

        res.json({
            studentId,
            reminders: {
                immediate: reminders.immediate,
                daily: reminders.daily,
                weekly: reminders.weekly,
                schedule: scheduleReminders,
                goals: goalReminders
            },
            companionMessage: generateReminderMessage(reminders),
            nextReminder: getNextReminderTime(reminders)
        });

    } catch (error) {
        console.error('获取学习提醒错误:', error);
        res.status(500).json({
            message: '获取学习提醒失败',
            error: error.message
        });
    }
};

/**
 * 记录学习成就
 */
const recordAchievement = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { achievementType, details, value } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 验证成就
        const achievement = await validateAndCreateAchievement(studentId, achievementType, details, value);

        // 更新伙伴状态
        const companionReaction = await updateCompanionForAchievement(studentId, achievement);

        // 生成庆祝消息
        const celebration = await generateCelebrationMessage(student.name, achievement);

        // 检查是否解锁新功能或奖励
        const unlocks = await checkForUnlocks(studentId, achievement);

        res.json({
            message: '成就记录成功',
            data: {
                achievement: achievement,
                companionReaction: companionReaction,
                celebration: celebration,
                unlocks: unlocks,
                nextMilestone: getNextMilestone(studentId, achievementType)
            }
        });

    } catch (error) {
        console.error('记录学习成就错误:', error);
        res.status(500).json({
            message: '记录学习成就失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 获取伙伴状态
 */
const getCompanionState = async (studentId) => {
    // 基于学生学习情况确定伙伴状态
    const recentActivity = await getRecentLearningActivity(studentId);
    
    return {
        name: 'AI小助手',
        mood: determineMood(recentActivity),
        level: calculateCompanionLevel(studentId),
        avatar: 'friendly_robot',
        personality: 'encouraging_and_supportive'
    };
};

/**
 * 获取今日学习进度
 */
const getTodayProgress = async (studentId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAnswers = await Answer.find({
        student: studentId,
        submitTime: { $gte: today }
    });

    const todayPractices = await PracticeRecord.find({
        student: studentId,
        startTime: { $gte: today }
    });

    return {
        questionsAnswered: todayAnswers.length,
        practicesSessions: todayPractices.length,
        timeSpent: todayPractices.reduce((sum, p) => sum + (p.totalTime || 0), 0),
        averageScore: todayAnswers.length > 0 ? 
            todayAnswers.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / todayAnswers.length * 100 : 0,
        streak: await calculateLearningStreak(studentId)
    };
};

/**
 * 生成个性化问候
 */
const generatePersonalizedGreeting = async (student, todayProgress) => {
    const hour = new Date().getHours();
    let timeGreeting;
    
    if (hour < 12) timeGreeting = '早上好';
    else if (hour < 18) timeGreeting = '下午好';
    else timeGreeting = '晚上好';

    let progressComment = '';
    if (todayProgress.questionsAnswered > 0) {
        progressComment = `今天你已经完成了${todayProgress.questionsAnswered}道题目，表现不错！`;
    } else {
        progressComment = '今天还没有开始学习，让我们一起加油吧！';
    }

    return {
        greeting: `${timeGreeting}，${student.name}！`,
        progressComment: progressComment,
        encouragement: generateDailyEncouragement(todayProgress)
    };
};

/**
 * 获取学生学习状态
 */
const getStudentLearningState = async (studentId) => {
    const recentAnswers = await Answer.find({
        student: studentId,
        submitTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).limit(20);

    const recentPractices = await PracticeRecord.find({
        student: studentId,
        endTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).limit(10);

    return {
        recentPerformance: calculateRecentPerformance(recentAnswers),
        learningFrequency: recentPractices.length,
        currentStreak: await calculateLearningStreak(studentId),
        strugglingAreas: identifyStrugglingAreas(recentAnswers),
        strongAreas: identifyStrongAreas(recentAnswers),
        mood: estimateStudentMood(recentAnswers, recentPractices)
    };
};

/**
 * 分析对话以提供额外支持
 */
const analyzeConversationForSupport = async (userMessage, companionResponse, learningState) => {
    // 检测是否需要额外帮助
    const needsHelp = detectHelpNeeded(userMessage);
    const emotionalState = detectEmotionalState(userMessage);
    
    let support = {};
    
    if (needsHelp) {
        support.helpResources = await suggestHelpResources(userMessage, learningState);
    }
    
    if (emotionalState === 'frustrated' || emotionalState === 'discouraged') {
        support.encouragement = await generateEmotionalSupport(emotionalState);
    }
    
    return support;
};

/**
 * 记录伙伴互动
 */
const recordCompanionInteraction = async (studentId, interaction) => {
    // 这里可以保存到数据库或日志系统
    console.log(`学习伙伴互动记录 - 学生${studentId}:`, interaction);
};

// 其他辅助函数的简化实现
const getRecentLearningActivity = async (studentId) => {
    return { active: true, performance: 'good' };
};

const determineMood = (activity) => {
    return activity.performance === 'good' ? 'happy' : 'encouraging';
};

const calculateCompanionLevel = (studentId) => {
    return 1; // 简化实现
};

const getRecentPerformance = async (studentId) => {
    return { averageScore: 75, trend: 'improving' };
};

const generateEncouragement = async (student, performance, context) => {
    return {
        message: `${student.name}，你做得很好！继续保持这个学习节奏。`,
        actions: ['继续当前的学习计划', '尝试挑战更难的题目'],
        quote: '每一次努力都是进步的阶梯！'
    };
};

const analyzeGoalFeasibility = async (studentId, goals, timeframe) => {
    return {
        feasible: true,
        difficulty: 'moderate',
        suggestions: ['目标设置合理', '建议制定详细计划']
    };
};

const generateGoalPlan = async (goals, analysis, timeframe) => {
    return {
        phases: goals.map((goal, index) => ({
            id: index + 1,
            goal: goal,
            duration: Math.ceil(timeframe / goals.length),
            milestones: [`完成${goal}的50%`, `完成${goal}`]
        })),
        totalDuration: timeframe
    };
};

const createGoalCheckpoints = async (plan) => {
    return plan.phases.map(phase => ({
        phaseId: phase.id,
        checkDate: new Date(Date.now() + phase.duration * 24 * 60 * 60 * 1000),
        description: `检查${phase.goal}的进度`
    }));
};

const saveStudentGoals = async (studentId, goalData) => {
    console.log('保存学生目标:', studentId, goalData);
};

const generateGoalSettingEncouragement = async (studentName, goals) => {
    return `太棒了，${studentName}！你设定了${goals.length}个学习目标。让我们一起努力实现它们吧！`;
};

const generatePersonalizedReminders = async (studentId) => {
    return {
        immediate: ['完成今天的练习题'],
        daily: ['保持学习节奏'],
        weekly: ['复习本周学习内容']
    };
};

const getScheduleReminders = async (studentId) => {
    return [
        { time: '19:00', message: '该开始今晚的学习了' }
    ];
};

const getGoalProgressReminders = async (studentId) => {
    return [
        { goal: '提升数学成绩', progress: 60, message: '目标进度良好，继续加油！' }
    ];
};

const generateReminderMessage = (reminders) => {
    return '我为你准备了一些学习提醒，记得按时完成哦！';
};

const getNextReminderTime = (reminders) => {
    return new Date(Date.now() + 60 * 60 * 1000); // 1小时后
};

const validateAndCreateAchievement = async (studentId, type, details, value) => {
    return {
        id: Date.now(),
        type: type,
        title: `${type}成就`,
        description: details,
        value: value,
        earnedAt: new Date()
    };
};

const updateCompanionForAchievement = async (studentId, achievement) => {
    return {
        mood: 'excited',
        message: '哇！你获得了新成就！我为你感到骄傲！'
    };
};

const generateCelebrationMessage = async (studentName, achievement) => {
    return `🎉 恭喜${studentName}获得"${achievement.title}"成就！${achievement.description}`;
};

const checkForUnlocks = async (studentId, achievement) => {
    return [
        { type: 'feature', name: '高级练习模式', description: '解锁更多练习功能' }
    ];
};

const getNextMilestone = (studentId, achievementType) => {
    return {
        type: achievementType,
        target: '下一个里程碑',
        progress: 75
    };
};

// 数据分析辅助函数
const calculateRecentPerformance = (answers) => {
    if (answers.length === 0) return 0;
    return answers.reduce((sum, a) => sum + (a.score / a.maxScore), 0) / answers.length * 100;
};

const calculateLearningStreak = async (studentId) => {
    // 计算连续学习天数
    return 5; // 简化实现
};

const identifyStrugglingAreas = (answers) => {
    const wrongAnswers = answers.filter(a => !a.isCorrect);
    return [...new Set(wrongAnswers.flatMap(a => a.question?.knowledgePoints || []))].slice(0, 3);
};

const identifyStrongAreas = (answers) => {
    const correctAnswers = answers.filter(a => a.isCorrect);
    return [...new Set(correctAnswers.flatMap(a => a.question?.knowledgePoints || []))].slice(0, 3);
};

const estimateStudentMood = (answers, practices) => {
    const recentPerf = calculateRecentPerformance(answers);
    if (recentPerf >= 80) return 'confident';
    if (recentPerf >= 60) return 'neutral';
    return 'needs_encouragement';
};

const updateCompanionMood = (userMessage, response) => {
    return 'supportive';
};

const generateConversationSuggestions = (learningState) => {
    return [
        '询问学习建议',
        '分享学习心得',
        '请求鼓励支持'
    ];
};

const detectHelpNeeded = (message) => {
    const helpKeywords = ['不懂', '不会', '困难', '帮助'];
    return helpKeywords.some(keyword => message.includes(keyword));
};

const detectEmotionalState = (message) => {
    if (message.includes('沮丧') || message.includes('难过')) return 'discouraged';
    if (message.includes('烦躁') || message.includes('生气')) return 'frustrated';
    return 'neutral';
};

const suggestHelpResources = async (message, learningState) => {
    return [
        { type: 'tutorial', title: '相关教程', url: '#' },
        { type: 'practice', title: '基础练习', url: '#' }
    ];
};

const generateEmotionalSupport = async (emotionalState) => {
    const supportMessages = {
        frustrated: '我理解你的感受。学习有时确实会让人感到挫折，但这是成长的一部分。',
        discouraged: '不要气馁！每个人都有学习的低谷期，重要的是坚持下去。'
    };
    
    return {
        message: supportMessages[emotionalState] || '我相信你能克服困难！',
        suggestions: ['休息一下', '换个学习方法', '寻求帮助']
    };
};

const generateDailyEncouragement = (progress) => {
    if (progress.questionsAnswered >= 10) {
        return '今天的学习量很充实，你真的很努力！';
    } else if (progress.questionsAnswered >= 5) {
        return '不错的开始，继续保持这个节奏！';
    } else {
        return '新的一天，新的开始！让我们一起学习吧！';
    }
};

module.exports = {
    getCompanionStatus,
    chatWithCompanion,
    getEncouragement,
    setLearningGoals,
    getLearningReminders,
    recordAchievement
};
