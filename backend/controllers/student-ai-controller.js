const StudentLearning = require('../models/studentLearningSchema');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Courseware = require('../models/coursewareSchema');
const PracticeQuestion = require('../models/practiceQuestionSchema');
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


  // 优先从题库缓存获取
  const query = { subject: subjectId, difficulty: adjustedDifficulty, isActive: true };
  if (questionTypes && questionTypes.length === 1) query.questionType = questionTypes[0];

  const cachedQuestions = await PracticeQuestion.find(query)
    .sort({ usageCount: 1, correctRate: -1 })
    .limit(questionCount || 5)
    .lean();

  const needed = (questionCount || 5) - cachedQuestions.length;

  if (needed <= 0) {
    // 缓存充足，直接使用
    const practiceId = new mongoose.Types.ObjectId();
    const practiceRecord = {
      practiceId,
      generatedAt: new Date(),
      practiceConfig: { chapterContent, difficulty: adjustedDifficulty, questionCount: cachedQuestions.length, questionTypes, focusAreas: studentWeakAreas },
      questions: cachedQuestions.map(q => ({
        questionId: q._id.toString(),
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctAnswerText: q.correctAnswerText,
        explanation: q.explanation || '',
        difficulty: q.difficulty,
        points: q.points || 10,
        knowledgePoints: q.knowledgePoints || [],
        acceptableAnswers: q.acceptableAnswers || []
      })),
      practiceStats: { totalQuestions: cachedQuestions.length, correctAnswers: 0, totalScore: 0, maxScore: cachedQuestions.length * 10, accuracy: 0, averageTime: 0, completionRate: 0 }
    };
    learningRecord.practiceHistory.push(practiceRecord);
    await learningRecord.save();

    // 异步更新使用计数
    PracticeQuestion.updateMany({ _id: { $in: cachedQuestions.map(q => q._id) } }, { $inc: { usageCount: 1 } }).exec();

    return res.json({
      success: true, practiceId: practiceId.toString(), dataSource: 'cache',
      questions: practiceRecord.questions.map(q => ({ questionId: q.questionId, questionText: q.questionText, questionType: q.questionType, options: q.options, difficulty: q.difficulty, points: q.points })),
      totalQuestions: practiceRecord.questions.length, estimatedTime: practiceRecord.questions.length * 2, difficulty: adjustedDifficulty
    });
  }

  // 缓存不足，调用Dify补充
  let aiQuestions = [];
  let dataSource = cachedQuestions.length > 0 ? 'cache_fallback' : 'dify';
  try {
    const context = { studentId, subjectId, subjectName: subject.subName, chapterContent, difficulty: adjustedDifficulty, questionCount: needed, questionTypes: questionTypes || ['选择题', '填空题'], studentWeakAreas };
    const aiResponse = await difyService.generatePracticeQuestions(context);
    if (aiResponse.success && aiResponse.questions.length > 0) {
      aiQuestions = aiResponse.questions;
      dataSource = cachedQuestions.length > 0 ? 'cache_and_dify' : 'dify';
      // 异步写入题库（不阻塞响应）
      const docs = aiQuestions.map(q => {
        const no = normalizeOptions(q.options);
        return { questionText: q.questionText || q.question, questionType: q.questionType || '选择题', subject: subjectId, school: learningRecord.school || null, difficulty: q.difficulty || adjustedDifficulty, options: no, correctAnswer: q.correctAnswer || q.answer, correctAnswerText: q.correctAnswerText || '', explanation: q.explanation || '', knowledgePoints: q.knowledgePoints || [], points: q.points || 10, acceptableAnswers: q.acceptableAnswers || [], source: 'dify' };
      });
      PracticeQuestion.insertMany(docs).catch(e => console.error('题库写入失败:', e.message));
    }
  } catch (aiErr) {
    console.error('Dify生成失败，使用缓存回退:', aiErr.message);
    if (cachedQuestions.length === 0) return res.status(500).json({ success: false, message: '题目生成失败且无缓存', error: aiErr.message });
  }

  const allQuestions = [...cachedQuestions.map(q => ({
    questionId: q._id.toString(), questionText: q.questionText, questionType: q.questionType,
    options: q.options || [], correctAnswer: q.correctAnswer, correctAnswerText: q.correctAnswerText,
    explanation: q.explanation || '', difficulty: q.difficulty, points: q.points || 10,
    knowledgePoints: q.knowledgePoints || [], acceptableAnswers: q.acceptableAnswers || []
  })), ...aiQuestions.map(q => {
    const no = normalizeOptions(q.options);
    return {
      questionId: q.id || 'q_' + Date.now() + '_' + Math.random(), questionText: q.questionText || q.question,
      questionType: q.questionType || '选择题', options: no, correctAnswer: q.correctAnswer || q.answer,
      explanation: q.explanation || '', difficulty: q.difficulty || adjustedDifficulty, points: q.points || 10,
      knowledgePoints: q.knowledgePoints || []
    };
  })];

  const practiceId = new mongoose.Types.ObjectId();
  const practiceRecord = {
    practiceId, generatedAt: new Date(),
    practiceConfig: { chapterContent, difficulty: adjustedDifficulty, questionCount: allQuestions.length, questionTypes, focusAreas: studentWeakAreas },
    questions: allQuestions,
    practiceStats: { totalQuestions: allQuestions.length, correctAnswers: 0, totalScore: 0, maxScore: allQuestions.length * 10, accuracy: 0, averageTime: 0, completionRate: 0 }
  };
  learningRecord.practiceHistory.push(practiceRecord);
  await learningRecord.save();

  res.json({
    success: true, practiceId: practiceId.toString(), dataSource,
    questions: practiceRecord.questions.map(q => ({ questionId: q.questionId, questionText: q.questionText, questionType: q.questionType, options: q.options, difficulty: q.difficulty, points: q.points })),
    totalQuestions: practiceRecord.questions.length, estimatedTime: practiceRecord.questions.length * 2, difficulty: adjustedDifficulty
  });

    } catch (error) {
        console.error('生成练习题目错误:', error);
        res.status(500).json({
            success: false,
            message: '生成练习失败',
            error: error.message
        });
    }
};


// 本地判改引擎
const evaluateLocally = (question, studentAnswer) => {
    const qType = question.questionType;
    const correctAnswer = question.correctAnswer || '';

    if (qType === '选择题') {
        const ns = String(studentAnswer).trim().toLowerCase();
        const nc = String(correctAnswer).trim().toLowerCase();
        let matched = ns === nc;
        if (!matched && question.options && question.options.length > 0) {
            const mo = question.options.find(o => o.isCorrect && String(o.text).trim().toLowerCase() === ns);
            if (mo) matched = true;
            if (!matched) {
                const co = question.options.find(o => o.isCorrect);
                if (co) {
                    const ci = question.options.indexOf(co);
                    if (ns === String.fromCharCode(65 + ci).toLowerCase()) matched = true;
                }
            }
        }
        return { isCorrect: matched, score: matched ? (question.points || 10) : 0, feedback: matched ? '回答正确！' : '正确答案是：' + correctAnswer, evaluationMethod: 'local_exact' };
    }

    if (qType === '填空题') {
        const ns = String(studentAnswer).trim().toLowerCase();
        const nc = String(correctAnswer).trim().toLowerCase();
        if (ns === nc) return { isCorrect: true, score: question.points || 10, feedback: '回答正确！', evaluationMethod: 'local_exact' };
        const al = question.acceptableAnswers || [];
        if (al.length > 0 && al.some(a => String(a).trim().toLowerCase() === ns)) return { isCorrect: true, score: question.points || 10, feedback: '回答正确！', evaluationMethod: 'local_fuzzy' };
        const ck = nc.split(/[，,、\s]+/).filter(k => k.length > 0);
        if (ck.length > 0) {
            const hc = ck.filter(kw => ns.includes(kw)).length;
            const hr = hc / ck.length;
            if (hr >= 0.8) return { isCorrect: true, score: question.points || 10, feedback: '回答基本正确', evaluationMethod: 'local_keyword' };
            if (hr >= 0.5) return { isCorrect: false, score: Math.round((question.points || 10) * hr), feedback: '部分正确，正确答案：' + correctAnswer, evaluationMethod: 'local_keyword' };
        }
        return { isCorrect: false, score: 0, feedback: '正确答案是：' + correctAnswer, evaluationMethod: 'local_exact' };
    }

    if (['简答题', '计算题', '编程题'].includes(qType)) {
        const ck = String(correctAnswer).split(/[，,、。.；;\s]+/).filter(k => k.length > 1);
        const sl = String(studentAnswer).trim().toLowerCase();
        let hr = 0;
        if (ck.length > 0) hr = ck.filter(kw => sl.includes(kw.toLowerCase())).length / ck.length;
        return {
            isCorrect: hr >= 0.7, score: Math.round((question.points || 10) * hr),
            feedback: hr >= 0.7 ? '初步判断正确，AI详细解析稍后补充' : '初步判断不完整，参考：' + correctAnswer,
            evaluationMethod: 'local_keyword_preliminary', needsAIFollowUp: true
        };
    }

    return { isCorrect: false, score: 0, feedback: '', evaluationMethod: 'unknown', needsAIFollowUp: true };
};

const submitPracticeAnswer = async (req, res) => {
    try {
        const { studentId, subjectId, practiceId, questionId, studentAnswer, timeTaken } = req.body;

        const learningRecord = await StudentLearning.findOne({ student: studentId, subject: subjectId });
        if (!learningRecord) return res.status(404).json({ success: false, message: '学习记录不存在' });

        const practice = learningRecord.practiceHistory.find(p => p.practiceId.toString() === practiceId.toString());
        if (!practice) return res.status(404).json({ success: false, message: '练习记录不存在' });

        const question = practice.questions.find(q => q.questionId === questionId);
        if (!question) return res.status(404).json({ success: false, message: '题目不存在' });

        const localResult = evaluateLocally(question, studentAnswer);

        const evaluation = {
            isCorrect: localResult.isCorrect,
            score: localResult.score,
            feedback: localResult.feedback,
            evaluationMethod: localResult.evaluationMethod,
            errorAnalysis: localResult.isCorrect ? null : { errorType: 'answer_mismatch', suggestion: localResult.feedback, relatedConcepts: question.knowledgePoints || [] },
            detailedExplanation: question.explanation || ''
        };

        question.studentAnswer = studentAnswer;
        question.submittedAt = new Date();
        question.timeTaken = timeTaken || 0;
        question.evaluation = evaluation;

        if (question.knowledgePoints && question.knowledgePoints.length > 0) {
            question.knowledgePoints.forEach(kp => learningRecord.updateKnowledgeMastery(kp, evaluation.isCorrect));
        }

        const aq = practice.questions.filter(q => q.studentAnswer !== undefined && q.studentAnswer !== null);
        const cq = aq.filter(q => q.evaluation?.isCorrect === true);
        practice.practiceStats.correctAnswers = cq.length;
        practice.practiceStats.totalScore = aq.reduce((s, q) => s + (q.evaluation?.score || 0), 0);
        practice.practiceStats.accuracy = aq.length > 0 ? (cq.length / aq.length) * 100 : 0;
        practice.practiceStats.completionRate = (aq.length / practice.questions.length) * 100;
        const tt = aq.reduce((s, q) => s + (q.timeTaken || 0), 0);
        practice.practiceStats.averageTime = aq.length > 0 ? tt / aq.length : 0;
        practice.practiceStats.totalTime = tt;

        if (practice.practiceStats.completionRate === 100) {
            practice.completedAt = new Date();
            const os = learningRecord.learningProgress.overallStats;
            os.totalQuestions += practice.questions.length;
            os.totalCorrect += practice.practiceStats.correctAnswers;
            os.overallAccuracy = os.totalQuestions > 0 ? (os.totalCorrect / os.totalQuestions) * 100 : 0;
        }

        await learningRecord.save();

        // 简答题/编程题：后台异步调AI补充详细解析
        if (localResult.needsAIFollowUp) {
            const ctx = { studentId, subjectId, questionCount: practice.questions.length };
            difyService.evaluateStudentAnswer(question, studentAnswer, ctx)
                .then(r => {
                    if (r.success && r.evaluation) {
                        question.evaluation.aiDetailedFeedback = r.evaluation.feedback || r.evaluation.detailedExplanation;
                        question.evaluation.aiEvaluationComplete = true;
                        learningRecord.save().catch(e => console.error('异步保存AI解析失败:', e.message));
                    }
                }).catch(err => console.error('异步AI解析失败:', err.message));
        }

        res.json({ success: true, evaluation, practiceStats: practice.practiceStats, isCompleted: practice.practiceStats.completionRate === 100 });
    } catch (error) {
        console.error('提交练习答案错误:', error);
        res.status(500).json({ success: false, message: '提交答案失败', error: error.message });
    }
};

module.exports = {
    askLearningAssistant,
    generatePracticeQuestions,
    submitPracticeAnswer
};
