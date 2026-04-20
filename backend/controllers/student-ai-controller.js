const StudentLearning = require('../models/studentLearningSchema');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Courseware = require('../models/coursewareSchema');
const mongoose = require('mongoose');

// 标准化选项格式的辅助函数
const normalizeOptions = (options) => {
    if (!options) {
        return [];
    }

    // 如果已经是正确格式的对象数组
    if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && options[0].text !== undefined) {
        return options.map(opt => ({
            text: String(opt.text || ''),
            isCorrect: Boolean(opt.isCorrect)
        }));
    }

    // 如果是字符串数组
    if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
        return options.map((optText, index) => ({
            text: String(optText),
            isCorrect: index === 0 // 默认第一个为正确答案
        }));
    }

    // 如果是单个字符串（错误情况）
    if (typeof options === 'string') {
        return [{
            text: String(options),
            isCorrect: true
        }];
    }

    // 如果是其他类型，尝试转换为字符串
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        // 可能是单个选项对象
        return [{
            text: String(options.text || options.toString()),
            isCorrect: Boolean(options.isCorrect)
        }];
    }

    // 其他情况返回空数组
    return [];
};
const difyService = require('../services/difyService');

// 在线学习助手 - 问答功能
const askLearningAssistant = async (req, res) => {
    try {
        const { studentId, subjectId, question, conversationId } = req.body;

        // 验证输入参数
        if (!studentId || !subjectId || !question) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：studentId, subjectId, question'
            });
        }

        // 验证ObjectId格式
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                success: false,
                message: '无效的学生ID格式'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: '无效的科目ID格式'
            });
        }

        // 验证学生和科目
        const student = await Student.findById(studentId)
            .populate('sclassName')
            .populate('selectedSubjects.subject', 'subName subCode');
        const subject = await Subject.findById(subjectId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: '科目不存在'
            });
        }

        // 验证学生是否选择了该科目（过滤掉subject为null的无效记录）
        const hasSelectedSubject = student.selectedSubjects.some(
            selectedSub => selectedSub.subject && selectedSub.subject._id.toString() === subjectId
        );

        if (!hasSelectedSubject) {
            return res.status(403).json({
                success: false,
                message: '您还没有选择该科目，请先到"课程管理"页面选择科目'
            });
        }

        // 获取或创建学习记录
        let learningRecord = await StudentLearning.findOne({
            student: studentId,
            subject: subjectId
        });

        if (!learningRecord) {
            learningRecord = new StudentLearning({
                student: studentId,
                subject: subjectId,
                school: student.school,
                learningProgress: {
                    knowledgeMastery: [],
                    weakAreas: [],
                    learningGoals: [],
                    overallStats: {
                        totalStudyTime: 0,
                        totalQuestions: 0,
                        totalCorrect: 0,
                        overallAccuracy: 0,
                        streakDays: 0,
                        averageSessionTime: 0
                    }
                },
                learningConversations: [],
                practiceHistory: []
            });
        }

        // 获取相关教学内容
        const courseware = await Courseware.find({
            subject: subjectId,
            status: '已发布'
        }).limit(3);

        const courseContent = courseware.map(cw => 
            `课件：${cw.title}\n大纲：${cw.syllabus}\n知识点：${cw.knowledgePoints.map(kp => kp.title).join(', ')}`
        ).join('\n\n');

        // 获取学生历史表现
        const recentPerformance = learningRecord.recentPerformance || [];
        const studentHistory = `
        最近练习表现：
        ${recentPerformance.map(p => `日期：${p.date?.toLocaleDateString()} 正确率：${p.accuracy}%`).join('\n')}
        
        薄弱环节：
        ${learningRecord.learningProgress.weakAreas.map(wa => wa.area).join(', ') || '暂无'}
        `;

        // 调用Dify AI服务
        const context = {
            studentId,
            subjectId,
            subjectName: subject.subName,
            courseContent,
            studentHistory,
            conversationId
        };

        const aiResponse = await difyService.chatWithLearningAssistant(question, context);

        if (aiResponse.success) {
            // 查找或创建对话记录
            let conversation = learningRecord.learningConversations.find(
                conv => conv.conversationId === (conversationId || aiResponse.conversationId)
            );

            if (!conversation) {
                conversation = {
                    conversationId: aiResponse.conversationId || `conv_${Date.now()}`,
                    startTime: new Date(),
                    messageCount: 0,
                    topic: question.substring(0, 50) + '...',
                    messages: []
                };
                learningRecord.learningConversations.push(conversation);
            }

            // 添加消息记录
            conversation.messages.push({
                messageId: aiResponse.messageId || `msg_${Date.now()}`,
                userMessage: question,
                aiResponse: aiResponse.answer,
                messageType: 'question'
            });

            conversation.messageCount += 1;
            conversation.endTime = new Date();

            // 更新学习时间
            learningRecord.learningProgress.overallStats.lastStudyDate = new Date();

            await learningRecord.save();

            res.json({
                success: true,
                answer: aiResponse.answer,
                conversationId: conversation.conversationId,
                messageId: conversation.messages[conversation.messages.length - 1].messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'AI助手暂时不可用',
                error: aiResponse.error
            });
        }

    } catch (error) {
        console.error('学习助手问答错误:', error);
        res.status(500).json({
            success: false,
            message: '问答服务失败',
            error: error.message
        });
    }
};

// 生成个性化练习题目
const generatePracticeQuestions = async (req, res) => {
    try {
        const { studentId, subjectId, chapterContent, difficulty, questionCount, questionTypes } = req.body;

        // 验证输入参数
        if (!studentId || !subjectId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：studentId, subjectId'
            });
        }

        // 验证ObjectId格式
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: '无效的ID格式'
            });
        }

        // 验证学生和科目
        const student = await Student.findById(studentId)
            .populate('selectedSubjects.subject', 'subName subCode');
        const subject = await Subject.findById(subjectId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: '科目不存在'
            });
        }

        // 验证学生是否选择了该科目（过滤掉subject为null的无效记录）
        const hasSelectedSubject = student.selectedSubjects.some(
            selectedSub => selectedSub.subject && selectedSub.subject._id.toString() === subjectId
        );

        if (!hasSelectedSubject) {
            return res.status(403).json({
                success: false,
                message: '您还没有选择该科目，请先到"课程管理"页面选择科目'
            });
        }

        // 获取学习记录
        let learningRecord = await StudentLearning.findOne({
            student: studentId,
            subject: subjectId
        });

        if (!learningRecord) {
            learningRecord = new StudentLearning({
                student: studentId,
                subject: subjectId,
                school: student.school
            });
        }

        // 分析学生薄弱环节
        const studentWeakAreas = learningRecord.learningProgress.weakAreas.map(wa => wa.area);
        
        // 根据历史表现调整难度
        const recentAccuracy = learningRecord.recentPerformance?.reduce((sum, p) => sum + p.accuracy, 0) / 
                              (learningRecord.recentPerformance?.length || 1);
        
        let adjustedDifficulty = difficulty;
        if (recentAccuracy > 85) {
            adjustedDifficulty = difficulty === '简单' ? '中等' : difficulty === '中等' ? '困难' : '困难';
        } else if (recentAccuracy < 60) {
            adjustedDifficulty = difficulty === '困难' ? '中等' : difficulty === '中等' ? '简单' : '简单';
        }

        // 调用Dify生成题目
        const context = {
            studentId,
            subjectId,
            subjectName: subject.subName,
            chapterContent,
            difficulty: adjustedDifficulty,
            questionCount: questionCount || 5,
            questionTypes: questionTypes || ['选择题', '填空题'],
            studentWeakAreas
        };

        const aiResponse = await difyService.generatePracticeQuestions(context);

        if (aiResponse.success) {
            console.log('AI响应成功，题目数量:', aiResponse.questions.length);
            console.log('第一道题目的选项:', aiResponse.questions[0]?.options);

            // 创建练习记录
            const practiceId = new mongoose.Types.ObjectId();
            const practiceRecord = {
                practiceId: practiceId,
                generatedAt: new Date(),
                practiceConfig: {
                    chapterContent,
                    difficulty: adjustedDifficulty,
                    questionCount: aiResponse.questions.length,
                    questionTypes,
                    focusAreas: studentWeakAreas
                },
                questions: aiResponse.questions.map((q, index) => {
                    console.log(`处理第${index + 1}道题目:`, {
                        原始选项: q.options,
                        选项类型: typeof q.options,
                        是否数组: Array.isArray(q.options)
                    });

                    const normalizedOptions = normalizeOptions(q.options);
                    console.log(`标准化后的选项:`, normalizedOptions);

                    return {
                        questionId: q.id || `q_${Date.now()}_${Math.random()}`,
                        questionText: q.questionText || q.question,
                        questionType: q.questionType || '选择题',
                        options: normalizedOptions,
                        correctAnswer: q.correctAnswer || q.answer,
                        explanation: q.explanation || '',
                        difficulty: q.difficulty || adjustedDifficulty,
                        points: q.points || 10,
                        knowledgePoints: q.knowledgePoints || []
                    };
                }),
                practiceStats: {
                    totalQuestions: aiResponse.questions.length,
                    correctAnswers: 0,
                    totalScore: 0,
                    maxScore: aiResponse.questions.length * 10,
                    accuracy: 0,
                    averageTime: 0,
                    completionRate: 0
                }
            };

            learningRecord.practiceHistory.push(practiceRecord);
            await learningRecord.save();

            res.json({
                success: true,
                practiceId: practiceId.toString(),
                questions: practiceRecord.questions.map(q => ({
                    questionId: q.questionId,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    options: q.options,
                    difficulty: q.difficulty,
                    points: q.points
                })), // 不返回正确答案
                totalQuestions: practiceRecord.questions.length,
                estimatedTime: practiceRecord.questions.length * 2, // 估计每题2分钟
                difficulty: adjustedDifficulty
            });
        } else {
            res.status(500).json({
                success: false,
                message: '题目生成失败',
                error: aiResponse.error
            });
        }

    } catch (error) {
        console.error('生成练习题目错误:', error);
        res.status(500).json({
            success: false,
            message: '生成练习失败',
            error: error.message
        });
    }
};

// 提交练习答案并获得评估
const submitPracticeAnswer = async (req, res) => {
    try {
        const { studentId, subjectId, practiceId, questionId, studentAnswer, timeTaken } = req.body;

        console.log('提交答案请求:', {
            studentId,
            subjectId,
            practiceId,
            questionId,
            studentAnswer,
            timeTaken
        });

        // 查找学习记录和练习
        const learningRecord = await StudentLearning.findOne({
            student: studentId,
            subject: subjectId
        });

        if (!learningRecord) {
            return res.status(404).json({
                success: false,
                message: '学习记录不存在'
            });
        }

        console.log('查找练习记录:', {
            传入的practiceId: practiceId,
            practiceId类型: typeof practiceId,
            学习记录中的练习数量: learningRecord.practiceHistory.length,
            练习记录IDs: learningRecord.practiceHistory.map(p => p.practiceId.toString())
        });

        const practice = learningRecord.practiceHistory.find(p =>
            p.practiceId.toString() === practiceId.toString()
        );

        if (!practice) {
            return res.status(404).json({
                success: false,
                message: '练习记录不存在'
            });
        }

        const question = practice.questions.find(q => q.questionId === questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: '题目不存在'
            });
        }

        // 调用AI评估答案
        const context = {
            studentId,
            subjectId,
            questionCount: practice.questions.length // 传递题目总数用于计分
        };
        const evaluationResponse = await difyService.evaluateStudentAnswer(
            question,
            studentAnswer,
            context
        );

        if (evaluationResponse.success) {
            // 更新题目记录
            question.studentAnswer = studentAnswer;
            question.submittedAt = new Date();
            question.timeTaken = timeTaken || 0;
            question.evaluation = evaluationResponse.evaluation;

            console.log('题目评估结果:', {
                questionId: question.questionId,
                studentAnswer,
                evaluation: evaluationResponse.evaluation,
                timeTaken
            });

            // 更新知识点掌握情况
            if (question.knowledgePoints && question.knowledgePoints.length > 0) {
                question.knowledgePoints.forEach(kp => {
                    learningRecord.updateKnowledgeMastery(kp, evaluationResponse.evaluation.isCorrect);
                });
            }

            // 更新练习统计
            const answeredQuestions = practice.questions.filter(q => q.studentAnswer !== undefined && q.studentAnswer !== null);
            const correctQuestions = answeredQuestions.filter(q => q.evaluation?.isCorrect === true);

            practice.practiceStats.correctAnswers = correctQuestions.length;
            practice.practiceStats.totalScore = answeredQuestions.reduce((sum, q) =>
                sum + (q.evaluation?.score || 0), 0
            );
            practice.practiceStats.accuracy = answeredQuestions.length > 0 ?
                (correctQuestions.length / answeredQuestions.length) * 100 : 0;
            practice.practiceStats.completionRate =
                (answeredQuestions.length / practice.questions.length) * 100;

            // 计算平均用时
            const totalTime = answeredQuestions.reduce((sum, q) => sum + (q.timeTaken || 0), 0);
            practice.practiceStats.averageTime = answeredQuestions.length > 0 ?
                totalTime / answeredQuestions.length : 0;
            practice.practiceStats.totalTime = totalTime;

            console.log('更新练习统计:', {
                answeredCount: answeredQuestions.length,
                correctCount: correctQuestions.length,
                totalScore: practice.practiceStats.totalScore,
                accuracy: practice.practiceStats.accuracy,
                averageTime: practice.practiceStats.averageTime
            });

            // 如果练习完成，更新整体统计
            if (practice.practiceStats.completionRate === 100) {
                practice.completedAt = new Date();
                
                const overallStats = learningRecord.learningProgress.overallStats;
                overallStats.totalQuestions += practice.questions.length;
                overallStats.totalCorrect += practice.practiceStats.correctAnswers;
                overallStats.overallAccuracy = overallStats.totalQuestions > 0 ? 
                    (overallStats.totalCorrect / overallStats.totalQuestions) * 100 : 0;
            }

            await learningRecord.save();

            res.json({
                success: true,
                evaluation: evaluationResponse.evaluation,
                practiceStats: practice.practiceStats,
                isCompleted: practice.practiceStats.completionRate === 100
            });
        } else {
            res.status(500).json({
                success: false,
                message: '答案评估失败',
                error: evaluationResponse.error
            });
        }

    } catch (error) {
        console.error('提交练习答案错误:', error);
        res.status(500).json({
            success: false,
            message: '提交答案失败',
            error: error.message
        });
    }
};

module.exports = {
    askLearningAssistant,
    generatePracticeQuestions,
    submitPracticeAnswer
};
