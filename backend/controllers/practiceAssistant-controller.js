const Exercise = require('../models/exerciseSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const Question = require('../models/questionSchema');
const Student = require('../models/studentSchema');
const Answer = require('../models/answerSchema');
const aiService = require('../services/aiService');
const difyService = require('../services/difyService');
const AIResponseParser = require('../utils/aiResponseParser');
const { v4: uuidv4 } = require('uuid');

/**
 * 开始练习会话
 */
const startPracticeSession = async (req, res) => {
    try {
        const { studentId, subject, practiceType, difficulty, questionCount, timeLimit, preferences } = req.body;

        // 验证学生
        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('school', 'schoolName');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 获取学生档案
        const studentProfile = await getStudentPracticeProfile(studentId, subject);

        // 生成练习会话
        const sessionId = uuidv4();
        const practiceConfig = {
            studentId,
            studentId,
            subject,
            practiceType: practiceType || 'adaptive',
            preferences: {
                questionCount: questionCount || 10,
                difficulty: difficulty || 'medium',
                timeLimit: timeLimit || 0,
                ...preferences
            },
            studentProfile,
            sessionId
        };

        // 生成初始练习题目
        let initialQuestions = await generatePracticeQuestions(practiceConfig);

        // 确保返回的是正确的数组格式
        if (typeof initialQuestions === 'string') {
            console.error(`[Practice Generation] 返回值是字符串，尝试解析:`, initialQuestions.substring(0, 200));
            try {
                initialQuestions = JSON.parse(initialQuestions);
            } catch (error) {
                console.error(`[Practice Generation] 字符串解析失败:`, error.message);
                throw new Error('题目生成失败：返回格式错误');
            }
        }

        if (!Array.isArray(initialQuestions)) {
            console.error(`[Practice Generation] 返回值不是数组:`, typeof initialQuestions);
            throw new Error('题目生成失败：返回值不是数组');
        }

        // 确保题目数据是纯对象数组
        const cleanQuestions = initialQuestions.map((q, index) => {
            console.log(`[Practice Record] 处理题目 ${index + 1}:`, {
                type: typeof q,
                isObject: typeof q === 'object' && q !== null,
                hasId: q && q.id,
                title: q && q.title
            });

            if (typeof q === 'string') {
                console.error(`[Practice Record] 题目 ${index + 1} 是字符串:`, q.substring(0, 100));
                throw new Error(`题目 ${index + 1} 数据格式错误：是字符串而非对象`);
            }

            if (typeof q === 'object' && q !== null) {
                const cleanQuestion = {
                    id: String(q.id || ''),
                    title: String(q.title || ''),
                    question: String(q.question || ''),
                    content: String(q.content || ''),
                    type: String(q.type || 'multiple_choice'),
                    difficulty: String(q.difficulty || 'medium'),
                    points: Number(q.points || 1),
                    knowledgePoints: Array.isArray(q.knowledgePoints) ? q.knowledgePoints.map(String) : [],
                    expectedTime: Number(q.expectedTime || 120),
                    options: Array.isArray(q.options) ? q.options.map(String) : [],
                    correctAnswer: String(q.correctAnswer || ''),
                    explanation: String(q.explanation || ''),
                    hints: Array.isArray(q.hints) ? q.hints.map(String) : []
                };

                console.log(`[Practice Record] 题目 ${index + 1} 清理完成:`, {
                    id: cleanQuestion.id,
                    title: cleanQuestion.title,
                    type: cleanQuestion.type
                });

                return cleanQuestion;
            } else {
                console.error(`[Practice Record] 题目 ${index + 1} 不是对象:`, typeof q, q);
                throw new Error(`题目 ${index + 1} 数据格式错误：不是对象`);
            }
        });

        // 创建练习记录
        const practiceRecord = new PracticeRecord({
            student: studentId,
            exercise: null, // 动态练习，不关联固定练习
            practiceType: practiceType || 'adaptive', // 添加练习类型
            sessionId,
            startTime: new Date(),
            answers: [],
            totalScore: 0,
            maxScore: initialQuestions.reduce((sum, q) => sum + q.points, 0),
            status: 'in_progress',
            sessionQuestions: cleanQuestions, // 存储清理后的题目数据
            adaptiveData: {
                initialDifficulty: studentProfile.level,
                finalDifficulty: studentProfile.level,
                difficultyAdjustments: [],
                performancePattern: 'stable'
            }
        });

        // 调试信息
        console.log(`[Practice Record] 准备保存练习记录:`, {
            sessionId,
            questionsCount: initialQuestions.length,
            questionsType: typeof initialQuestions,
            firstQuestionType: initialQuestions[0] ? typeof initialQuestions[0] : 'undefined',
            isArray: Array.isArray(initialQuestions),
            firstQuestionSample: initialQuestions[0] ? JSON.stringify(initialQuestions[0]).substring(0, 200) : 'undefined'
        });

        // 确保initialQuestions是数组且包含对象
        if (!Array.isArray(initialQuestions)) {
            console.error(`[Practice Record] initialQuestions不是数组:`, typeof initialQuestions);
            throw new Error('题目数据格式错误：不是数组格式');
        }

        if (initialQuestions.length === 0) {
            console.error(`[Practice Record] initialQuestions为空数组`);
            throw new Error('题目数据为空');
        }

        if (typeof initialQuestions[0] !== 'object') {
            console.error(`[Practice Record] 题目元素不是对象:`, typeof initialQuestions[0]);
            throw new Error('题目数据格式错误：元素不是对象');
        }

        await practiceRecord.save();

        res.status(201).json({
            success: true,
            message: '练习会话开始',
            sessionId,
            questions: initialQuestions,
            data: {
                practiceRecord: practiceRecord._id,
                studentProfile: {
                    level: studentProfile.level,
                    strengths: studentProfile.strengths,
                    weakPoints: studentProfile.weakPoints
                },
                config: {
                    adaptiveEnabled: practiceType === 'adaptive',
                    timeLimit: timeLimit || preferences?.timeLimit || 0,
                    questionCount: questionCount || initialQuestions.length,
                    difficulty: difficulty || 'medium'
                }
            }
        });

    } catch (error) {
        console.error('开始练习会话错误:', error);
        res.status(500).json({
            message: '开始练习会话失败',
            error: error.message
        });
    }
};

/**
 * 提交练习答案并获取即时反馈
 */
const submitPracticeAnswer = async (req, res) => {
    try {
        const { sessionId, questionId, answer, timeSpent, requestHint } = req.body;

        // 获取练习记录
        const practiceRecord = await PracticeRecord.findOne({ sessionId })
            .populate('student', 'name');

        if (!practiceRecord) {
            return res.status(404).json({ message: '练习会话不存在' });
        }

        // 获取题目信息 - 支持动态生成的题目
        let question = null;

        // 尝试从数据库获取题目（传统题目）
        try {
            if (questionId.length === 24) { // MongoDB ObjectId长度
                question = await Question.findById(questionId);
            }
        } catch (error) {
            // 忽略ObjectId转换错误，继续处理动态题目
        }

        // 如果不是数据库题目，从练习记录中查找动态题目
        if (!question) {
            // 从当前会话的题目中查找
            const sessionQuestions = practiceRecord.sessionQuestions || [];
            const dynamicQuestion = sessionQuestions.find(q => q.id === questionId);

            if (dynamicQuestion) {
                question = dynamicQuestion;
            } else {
                return res.status(404).json({
                    message: '题目不存在',
                    questionId,
                    sessionId
                });
            }
        }

        // 如果请求提示
        if (requestHint) {
            const hint = await generateHint(question, answer, practiceRecord.student._id);
            return res.json({
                type: 'hint',
                hint: hint,
                sessionId
            });
        }

        // AI分析答案
        const analysisResult = await analyzeAnswerRealtime(question, answer, practiceRecord.student._id);

        // 更新练习记录
        const answerRecord = {
            question: questionId,
            answer: answer,
            isCorrect: analysisResult.isCorrect,
            score: analysisResult.score,
            timeSpent: timeSpent || 0,
            attempts: 1,
            hints: []
        };

        practiceRecord.answers.push(answerRecord);
        practiceRecord.totalScore += analysisResult.score;

        // 自适应难度调整
        const adaptiveAdjustment = await adjustDifficulty(practiceRecord, analysisResult);
        if (adaptiveAdjustment.adjusted) {
            practiceRecord.adaptiveData.difficultyAdjustments.push({
                questionIndex: practiceRecord.answers.length - 1,
                oldDifficulty: adaptiveAdjustment.oldDifficulty,
                newDifficulty: adaptiveAdjustment.newDifficulty,
                reason: adaptiveAdjustment.reason,
                timestamp: new Date()
            });
        }

        await practiceRecord.save();

        // 生成下一题（如果需要）
        const nextQuestion = await generateNextQuestion(practiceRecord, adaptiveAdjustment.currentDifficulty);

        // 实时学习分析
        const learningInsights = await generateLearningInsights(practiceRecord);

        res.json({
            message: '答案提交成功',
            data: {
                sessionId,
                feedback: {
                    isCorrect: analysisResult.isCorrect,
                    score: analysisResult.score,
                    maxScore: question.points,
                    explanation: analysisResult.explanation,
                    suggestions: analysisResult.suggestions,
                    encouragement: analysisResult.encouragement
                },
                nextQuestion: nextQuestion,
                progress: {
                    currentQuestion: practiceRecord.answers.length,
                    totalScore: practiceRecord.totalScore,
                    maxScore: practiceRecord.maxScore,
                    accuracy: calculateAccuracy(practiceRecord.answers),
                    timeSpent: practiceRecord.answers.reduce((sum, a) => sum + a.timeSpent, 0)
                },
                adaptiveInfo: adaptiveAdjustment.adjusted ? {
                    difficultyChanged: true,
                    newDifficulty: adaptiveAdjustment.newDifficulty,
                    reason: adaptiveAdjustment.reason
                } : null,
                learningInsights: learningInsights
            }
        });

    } catch (error) {
        console.error('提交练习答案错误:', error);
        res.status(500).json({
            message: '提交练习答案失败',
            error: error.message
        });
    }
};

/**
 * 获取练习提示
 */
const getPracticeHint = async (req, res) => {
    try {
        const { sessionId, questionId, currentAnswer } = req.body;

        const practiceRecord = await PracticeRecord.findOne({ sessionId });
        if (!practiceRecord) {
            return res.status(404).json({ message: '练习会话不存在' });
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }

        // 生成智能提示
        const hint = await generateIntelligentHint(question, currentAnswer, practiceRecord.student);

        // 记录提示使用
        const answerIndex = practiceRecord.answers.findIndex(a => a.question.toString() === questionId);
        if (answerIndex >= 0) {
            practiceRecord.answers[answerIndex].hints.push({
                hintText: hint.text,
                usedAt: new Date()
            });
            await practiceRecord.save();
        }

        res.json({
            sessionId,
            hint: hint,
            hintCount: (practiceRecord.answers[answerIndex]?.hints.length || 0) + 1
        });

    } catch (error) {
        console.error('获取练习提示错误:', error);
        res.status(500).json({
            message: '获取练习提示失败',
            error: error.message
        });
    }
};

/**
 * 完成练习会话
 */
const completePracticeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const practiceRecord = await PracticeRecord.findOne({ sessionId })
            .populate('student', 'name');

        if (!practiceRecord) {
            return res.status(404).json({ message: '练习会话不存在' });
        }

        // 更新练习状态
        practiceRecord.endTime = new Date();
        practiceRecord.totalTime = Math.floor((practiceRecord.endTime - practiceRecord.startTime) / 1000);
        practiceRecord.status = 'completed';
        practiceRecord.percentage = (practiceRecord.totalScore / practiceRecord.maxScore) * 100;

        // AI分析整体表现
        const sessionAnalysis = await analyzeSessionPerformance(practiceRecord);
        practiceRecord.aiAnalysis = sessionAnalysis;

        await practiceRecord.save();

        // 生成学习建议
        const learningRecommendations = await generateLearningRecommendations(practiceRecord);

        res.json({
            message: '练习会话完成',
            data: {
                sessionId,
                summary: {
                    totalQuestions: practiceRecord.answers.length,
                    correctAnswers: practiceRecord.answers.filter(a => a.isCorrect).length,
                    totalScore: practiceRecord.totalScore,
                    maxScore: practiceRecord.maxScore,
                    percentage: practiceRecord.percentage,
                    totalTime: practiceRecord.totalTime,
                    averageTimePerQuestion: practiceRecord.totalTime / practiceRecord.answers.length
                },
                analysis: sessionAnalysis,
                recommendations: learningRecommendations,
                achievements: generateAchievements(practiceRecord),
                nextSteps: generateNextSteps(practiceRecord)
            }
        });

    } catch (error) {
        console.error('完成练习会话错误:', error);
        res.status(500).json({
            message: '完成练习会话失败',
            error: error.message
        });
    }
};

/**
 * 获取练习历史
 */
const getPracticeHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, limit = 10, page = 1 } = req.query;

        const query = { student: studentId, status: 'completed' };
        if (subject) {
            // 需要通过exercise关联查询subject，这里简化处理
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const practiceHistory = await PracticeRecord.find(query)
            .populate('exercise', 'title type difficulty')
            .sort({ endTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PracticeRecord.countDocuments(query);

        // 计算统计信息
        const stats = calculatePracticeStats(practiceHistory);

        res.json({
            data: practiceHistory,
            stats: stats,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取练习历史错误:', error);
        res.status(500).json({
            message: '获取练习历史失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 获取学生练习档案
 */
const getStudentPracticeProfile = async (studentId, subject) => {
    // 获取最近练习记录
    const recentPractices = await PracticeRecord.find({
        student: studentId,
        status: 'completed',
        endTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ endTime: -1 }).limit(20);

    // 分析学习水平和偏好
    const level = calculatePracticeLevel(recentPractices);
    const strengths = identifyPracticeStrengths(recentPractices);
    const weakPoints = identifyPracticeWeakPoints(recentPractices);

    return {
        level,
        strengths,
        weakPoints,
        averageScore: recentPractices.reduce((sum, p) => sum + p.percentage, 0) / recentPractices.length || 0,
        preferredDifficulty: level,
        practiceFrequency: recentPractices.length
    };
};

/**
 * 生成练习题目
 */
const generatePracticeQuestions = async (config) => {
    const { studentId, studentProfile, subject, practiceType, preferences, sessionId } = config;

    try {
        console.log(`[Practice Generation] 基于知识库生成练习 - 学生${studentId}:`, {
            subject,
            practiceType,
            level: studentProfile.level,
            timestamp: new Date().toISOString()
        });

        // 调用Dify服务生成基于知识库的个性化练习
        const practiceData = {
            studentId: studentId,
            history: studentProfile.practiceHistory || [],
            requirements: `生成${preferences?.questionCount || 10}道${subject || '通用'}练习题`,
            knowledgePoints: studentProfile.weakPoints || [],
            difficulty: preferences?.difficulty || studentProfile.level || 'medium',
            questionType: practiceType || 'adaptive',
            studentProfile: {
                level: studentProfile.level,
                weakPoints: studentProfile.weakPoints,
                strengths: studentProfile.strengths,
                averageScore: studentProfile.averageScore,
                practiceFrequency: studentProfile.practiceFrequency
            }
        };

        const aiResult = await difyService.generatePracticeAndEvaluate(practiceData);

        if (aiResult && aiResult.answer) {
            console.log(`[Practice Generation] Dify生成成功 - 学生${studentId}`);
            console.log(`[Practice Generation] AI回复内容:`, aiResult.answer.substring(0, 500) + '...');

            // 尝试多种解析方式
            let questions = [];

            // 1. 尝试标准解析
            const parsed = AIResponseParser.parsePersonalizedExercise(aiResult.answer);
            if (parsed.success && parsed.data.exercises) {
                questions = parsed.data.exercises.map(ex => ({
                    id: uuidv4(),
                    title: ex.title,
                    question: ex.content || ex.question,
                    content: ex.content,
                    type: ex.type,
                    difficulty: ex.difficulty,
                    points: ex.points || 1,
                    knowledgePoints: ex.knowledgePoints,
                    expectedTime: ex.expectedTime,
                    hints: ex.hints || [],
                    options: ex.options || [],
                    correctAnswer: ex.correctAnswer
                }));
            } else {
                // 2. 尝试智能解析
                questions = parseAIResponse(aiResult.answer, preferences);
            }

            if (questions && questions.length > 0) {
                console.log(`[Practice Generation] 解析成功，生成${questions.length}道题目`);
                return questions;
            } else {
                console.log(`[Practice Generation] 解析失败，使用降级方案`);
            }
        }
    } catch (error) {
        console.error('[Practice Generation] Dify生成错误:', error);
    }

    // 降级：从数据库获取题目
    console.log(`[Practice Generation] 降级到数据库题目 - 学生${studentId}`);
    return await getFallbackQuestions(studentProfile, subject, preferences);
};

/**
 * 智能解析AI响应内容
 */
const parseAIResponse = (content, preferences) => {
    try {
        console.log(`[AI Parse] 开始解析AI响应，内容长度: ${content.length}`);

        // 1. 尝试解析JSON格式
        const jsonQuestions = tryParseJSON(content);
        if (jsonQuestions && jsonQuestions.length > 0) {
            console.log(`[AI Parse] JSON解析成功，题目数量: ${jsonQuestions.length}`);
            return jsonQuestions.map(q => formatQuestion(q, preferences));
        }

        // 2. 尝试解析JavaScript对象格式
        const jsQuestions = tryParseJavaScript(content);
        if (jsQuestions && jsQuestions.length > 0) {
            console.log(`[AI Parse] JavaScript解析成功，题目数量: ${jsQuestions.length}`);
            return jsQuestions.map(q => formatQuestion(q, preferences));
        }

        // 3. 尝试解析文本格式
        const textQuestions = parseSimplePracticeFormat(content, preferences);
        if (textQuestions && textQuestions.length > 0) {
            console.log(`[AI Parse] 文本解析成功，题目数量: ${textQuestions.length}`);
            return textQuestions;
        }

        console.log(`[AI Parse] 所有解析方式都失败`);
        return [];
    } catch (error) {
        console.error(`[AI Parse] 解析错误:`, error.message);
        return [];
    }
};

/**
 * 尝试解析JSON格式
 */
const tryParseJSON = (content) => {
    try {
        console.log(`[JSON Parse] 尝试解析JSON格式`);

        // 1. 查找 {"exercises": [...]} 格式
        const exercisesMatch = content.match(/\{\s*"exercises"\s*:\s*\[[\s\S]*?\]\s*\}/);
        if (exercisesMatch) {
            console.log(`[JSON Parse] 找到exercises格式`);
            const parsed = JSON.parse(exercisesMatch[0]);
            if (parsed.exercises && Array.isArray(parsed.exercises)) {
                console.log(`[JSON Parse] exercises解析成功，题目数量: ${parsed.exercises.length}`);
                return parsed.exercises;
            }
        }

        // 2. 查找JSON数组格式
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            console.log(`[JSON Parse] 找到数组格式`);
            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`[JSON Parse] 数组解析成功，题目数量: ${parsed.length}`);
            return parsed;
        }

        // 3. 尝试直接解析整个内容
        console.log(`[JSON Parse] 尝试直接解析整个内容`);
        const parsed = JSON.parse(content);
        if (parsed.exercises && Array.isArray(parsed.exercises)) {
            return parsed.exercises;
        }
        return parsed;
    } catch (error) {
        console.error(`[JSON Parse] 解析失败:`, error.message);
        return null;
    }
};

/**
 * 尝试解析JavaScript对象格式
 */
const tryParseJavaScript = (content) => {
    try {
        console.log(`[JS Parse] 尝试解析JavaScript格式`);

        // 查找JavaScript数组格式
        const jsMatch = content.match(/\[[\s\S]*\]/);
        if (jsMatch) {
            let jsStr = jsMatch[0];
            console.log(`[JS Parse] 找到数组格式，长度: ${jsStr.length}`);

            // 转换JavaScript格式为JSON格式
            jsStr = jsStr
                .replace(/(\w+):/g, '"$1":')  // 属性名加引号
                .replace(/'/g, '"')           // 单引号改双引号
                .replace(/,(\s*[}\]])/g, '$1'); // 移除尾随逗号

            console.log(`[JS Parse] 转换后的JSON格式:`, jsStr.substring(0, 300) + '...');

            const parsed = JSON.parse(jsStr);
            console.log(`[JS Parse] 解析成功，题目数量: ${parsed.length}`);
            return parsed;
        }

        console.log(`[JS Parse] 未找到数组格式`);
        return null;
    } catch (error) {
        console.error(`[JS Parse] 解析失败:`, error.message);
        return null;
    }
};

/**
 * 格式化题目对象
 */
const formatQuestion = (q, preferences) => {
    return {
        id: q.id || uuidv4(),
        title: q.title || '练习题',
        question: q.question || q.content || '题目内容',
        content: q.content || q.question || '题目内容',
        type: q.type || 'multiple_choice',
        difficulty: q.difficulty || preferences?.difficulty || 'medium',
        points: q.points || 1,
        knowledgePoints: q.knowledgePoints || [],
        expectedTime: q.expectedTime || 120,
        hints: q.hints || [],
        options: q.options || ['A) 选项A', 'B) 选项B', 'C) 选项C', 'D) 选项D'],
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || '答案解释'
    };
};

/**
 * 解析简单格式的练习内容
 */
const parseSimplePracticeFormat = (content, preferences) => {
    try {
        // 尝试从AI回复中提取题目
        const questions = [];
        const lines = content.split('\n');
        let currentQuestion = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // 检测题目开始（数字开头）
            const questionMatch = trimmedLine.match(/^(\d+)[\.\)]\s*(.+)/);
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    id: uuidv4(),
                    title: `题目 ${questionMatch[1]}`,
                    question: questionMatch[2],
                    content: questionMatch[2],
                    type: 'single_choice', // 默认类型
                    difficulty: preferences?.difficulty || 'medium',
                    points: 1,
                    knowledgePoints: [],
                    expectedTime: 120, // 2分钟
                    hints: []
                };
            } else if (currentQuestion && trimmedLine.startsWith('A)') || trimmedLine.startsWith('B)') || trimmedLine.startsWith('C)') || trimmedLine.startsWith('D)')) {
                // 选择题选项
                if (!currentQuestion.options) {
                    currentQuestion.options = [];
                }
                currentQuestion.options.push(trimmedLine);
            } else if (currentQuestion && trimmedLine.startsWith('答案:')) {
                // 答案
                currentQuestion.correctAnswer = trimmedLine.replace('答案:', '').trim();
            }
        }

        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        // 如果没有解析到题目，生成默认题目
        if (questions.length === 0) {
            const questionCount = preferences?.questionCount || 5;
            for (let i = 1; i <= questionCount; i++) {
                questions.push({
                    id: uuidv4(),
                    title: `练习题 ${i}`,
                    question: `这是一道基于知识库的练习题 ${i}`,
                    content: `这是一道基于知识库的练习题 ${i}`,
                    type: 'multiple_choice',
                    difficulty: preferences?.difficulty || 'medium',
                    points: 1,
                    knowledgePoints: [],
                    expectedTime: 120,
                    hints: [],
                    options: ['A) 选项A', 'B) 选项B', 'C) 选项C', 'D) 选项D'],
                    correctAnswer: 'A'
                });
            }
        }

        return questions;
    } catch (error) {
        console.error('[Parse Simple Practice] 解析错误:', error);
        return [];
    }
};

/**
 * 实时分析答案
 */
const analyzeAnswerRealtime = async (question, answer, studentId) => {
    const analysisData = {
        questionId: question._id,
        question: question.content,
        answer: answer,
        correctAnswer: question.correctAnswer,
        questionType: question.type,
        subject: question.subject,
        studentId: studentId
    };

    const aiResult = await aiService.analyzeStudentAnswer(analysisData);

    if (aiResult.success) {
        const parsed = AIResponseParser.parseAnswerAnalysis(aiResult.answer);
        if (parsed.success) {
            return {
                isCorrect: parsed.data.isCorrect,
                score: parsed.data.score,
                explanation: parsed.data.feedback,
                suggestions: parsed.data.suggestions || [],
                encouragement: generateEncouragement(parsed.data.isCorrect)
            };
        }
    }

    // 降级：基础分析
    return {
        isCorrect: answer === question.correctAnswer,
        score: answer === question.correctAnswer ? question.points : 0,
        explanation: '答案已提交，请继续下一题',
        suggestions: [],
        encouragement: '继续加油！'
    };
};

/**
 * 调整难度
 */
const adjustDifficulty = async (practiceRecord, analysisResult) => {
    const recentAnswers = practiceRecord.answers.slice(-3); // 最近3题
    const recentAccuracy = recentAnswers.filter(a => a.isCorrect).length / recentAnswers.length;

    let newDifficulty = practiceRecord.adaptiveData.finalDifficulty;
    let adjusted = false;
    let reason = '';

    if (recentAccuracy >= 0.8 && newDifficulty !== 'hard') {
        newDifficulty = newDifficulty === 'easy' ? 'medium' : 'hard';
        adjusted = true;
        reason = '表现优秀，提升难度';
    } else if (recentAccuracy <= 0.3 && newDifficulty !== 'easy') {
        newDifficulty = newDifficulty === 'hard' ? 'medium' : 'easy';
        adjusted = true;
        reason = '需要巩固基础，降低难度';
    }

    if (adjusted) {
        practiceRecord.adaptiveData.finalDifficulty = newDifficulty;
    }

    return {
        adjusted,
        oldDifficulty: practiceRecord.adaptiveData.finalDifficulty,
        newDifficulty,
        currentDifficulty: newDifficulty,
        reason
    };
};

/**
 * 生成下一题
 */
const generateNextQuestion = async (practiceRecord, difficulty) => {
    // 简化实现：返回null表示练习结束
    if (practiceRecord.answers.length >= 10) {
        return null;
    }

    // 这里应该根据难度和学生表现生成下一题
    return {
        id: uuidv4(),
        title: '下一道练习题',
        content: '这是一道' + difficulty + '难度的题目',
        type: 'multiple_choice',
        difficulty: difficulty,
        points: 1,
        options: [
            { text: '选项A', isCorrect: true },
            { text: '选项B', isCorrect: false },
            { text: '选项C', isCorrect: false },
            { text: '选项D', isCorrect: false }
        ]
    };
};

// 其他辅助函数的简化实现
const generateHint = async (question, answer, studentId) => {
    return {
        text: '提示：仔细阅读题目，注意关键词',
        type: 'general',
        level: 1
    };
};

const generateIntelligentHint = async (question, currentAnswer, studentId) => {
    return {
        text: '智能提示：检查你的逻辑思路',
        type: 'intelligent',
        level: 2
    };
};

const generateLearningInsights = async (practiceRecord) => {
    return {
        currentStrength: '逻辑思维',
        needsImprovement: '计算准确性',
        suggestion: '多做计算练习'
    };
};

const calculateAccuracy = (answers) => {
    if (answers.length === 0) return 0;
    return (answers.filter(a => a.isCorrect).length / answers.length) * 100;
};

const analyzeSessionPerformance = async (practiceRecord) => {
    return {
        strengths: ['基础概念掌握良好'],
        weaknesses: ['计算速度需要提升'],
        recommendations: ['增加计算练习'],
        estimatedMastery: 75
    };
};

const generateLearningRecommendations = async (practiceRecord) => {
    return [
        {
            type: 'practice',
            title: '建议练习',
            description: '多做类似题目巩固知识'
        }
    ];
};

const generateAchievements = (practiceRecord) => {
    const achievements = [];
    if (practiceRecord.percentage >= 90) {
        achievements.push({ title: '优秀表现', description: '本次练习表现优异' });
    }
    return achievements;
};

const generateNextSteps = (practiceRecord) => {
    return [
        '复习错题',
        '加强薄弱知识点练习',
        '保持学习节奏'
    ];
};

const calculatePracticeLevel = (practices) => {
    const avgScore = practices.reduce((sum, p) => sum + p.percentage, 0) / practices.length || 0;
    if (avgScore >= 80) return 'advanced';
    if (avgScore >= 60) return 'intermediate';
    return 'beginner';
};

const identifyPracticeStrengths = (practices) => {
    return ['基础概念', '逻辑思维'];
};

const identifyPracticeWeakPoints = (practices) => {
    return ['计算能力', '应用题'];
};

const getFallbackQuestions = async (studentProfile, subject, preferences) => {
    const questionCount = preferences?.questionCount || 5;
    const difficulty = preferences?.difficulty || studentProfile.level || 'medium';
    const questions = [];

    for (let i = 1; i <= questionCount; i++) {
        questions.push({
            id: uuidv4(),
            title: `${subject || '通用'}练习题 ${i}`,
            question: `这是一道${difficulty}难度的${subject || '通用'}练习题 ${i}`,
            content: `这是一道${difficulty}难度的${subject || '通用'}练习题 ${i}`,
            type: 'multiple_choice',
            difficulty: difficulty,
            points: 1,
            knowledgePoints: [subject || '基础概念'],
            expectedTime: 120, // 2分钟
            options: [
                'A) 选项A',
                'B) 选项B',
                'C) 选项C',
                'D) 选项D'
            ],
            correctAnswer: 'A',
            explanation: '这是正确答案的解释'
        });
    }

    return questions;
};

const generateEncouragement = (isCorrect) => {
    return isCorrect ? '回答正确！继续保持！' : '没关系，继续努力！';
};

const calculatePracticeStats = (practices) => {
    return {
        totalPractices: practices.length,
        averageScore: practices.reduce((sum, p) => sum + p.percentage, 0) / practices.length || 0,
        totalTime: practices.reduce((sum, p) => sum + p.totalTime, 0),
        improvementTrend: 'stable'
    };
};

module.exports = {
    startPracticeSession,
    submitPracticeAnswer,
    getPracticeHint,
    completePracticeSession,
    getPracticeHistory
};
