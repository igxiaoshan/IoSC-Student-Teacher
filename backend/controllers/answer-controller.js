const Answer = require('../models/answerSchema');
const Question = require('../models/questionSchema');
const Exam = require('../models/examSchema');
const Student = require('../models/studentSchema');
const Feedback = require('../models/feedbackSchema');
const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 提交答案
 */
const submitAnswer = async (req, res) => {
    try {
        const {
            student,
            exam,
            question,
            answer,
            code,
            timeSpent,
            startTime
        } = req.body;

        // 检查是否已经提交过答案
        const existingAnswer = await Answer.findOne({ student, exam, question });
        if (existingAnswer && existingAnswer.status === 'submitted') {
            return res.status(400).json({ message: '该题目已经提交过答案' });
        }

        // 获取题目信息
        const questionInfo = await Question.findById(question);
        if (!questionInfo) {
            return res.status(404).json({ message: '题目不存在' });
        }

        const answerData = {
            student,
            exam,
            question,
            answer,
            code,
            maxScore: questionInfo.points,
            timeSpent: timeSpent || 0,
            startTime: startTime ? new Date(startTime) : new Date(),
            submitTime: new Date(),
            status: 'submitted'
        };

        let savedAnswer;
        if (existingAnswer) {
            // 更新现有答案
            savedAnswer = await Answer.findByIdAndUpdate(
                existingAnswer._id,
                answerData,
                { new: true }
            );
        } else {
            // 创建新答案
            const newAnswer = new Answer(answerData);
            savedAnswer = await newAnswer.save();
        }

        // 异步进行AI分析和评分
        analyzeAnswerAsync(savedAnswer._id);

        res.status(201).json({
            message: '答案提交成功',
            data: savedAnswer
        });

    } catch (error) {
        console.error('提交答案错误:', error);
        res.status(500).json({
            message: '提交答案失败',
            error: error.message
        });
    }
};

/**
 * 异步分析答案
 */
const analyzeAnswerAsync = async (answerId) => {
    try {
        const answer = await Answer.findById(answerId)
            .populate('question', 'content type correctAnswer options explanation knowledgePoints')
            .populate('student', 'name')
            .populate('exam', 'subject');

        if (!answer) return;

        // 准备AI分析数据
        const analysisData = {
            questionId: answer.question._id,
            question: answer.question.content,
            answer: answer.answer,
            correctAnswer: answer.question.correctAnswer,
            questionType: answer.question.type,
            subject: answer.exam.subject,
            studentId: answer.student._id,
            timeSpent: answer.timeSpent
        };

        // 调用AI服务分析答案
        const aiResult = await aiService.analyzeStudentAnswer(analysisData);

        if (aiResult.success) {
            const parsedResult = AIResponseParser.parseAnswerAnalysis(aiResult.answer);

            if (parsedResult.success) {
                // 更新答案记录
                await Answer.findByIdAndUpdate(answerId, {
                    score: parsedResult.data.score,
                    isCorrect: parsedResult.data.isCorrect,
                    aiEvaluation: {
                        autoScore: parsedResult.data.score,
                        confidence: parsedResult.data.confidence,
                        feedback: parsedResult.data.feedback,
                        suggestions: parsedResult.data.suggestions,
                        errorAnalysis: parsedResult.data.errorAnalysis
                    },
                    status: 'graded'
                });

                // 生成反馈
                await generateFeedback(answer, parsedResult.data);

                // 更新题目统计
                await updateQuestionStats(answer.question._id);
            }
        }
    } catch (error) {
        console.error('异步分析答案错误:', error);
    }
};

/**
 * 生成反馈
 */
const generateFeedback = async (answer, analysisResult) => {
    try {
        const feedback = new Feedback({
            fromUser: null, // 系统生成
            fromUserType: 'system',
            toUser: answer.student._id,
            toUserType: 'student',
            school: answer.exam.school,
            feedbackType: 'answer_correction',
            relatedResource: {
                resourceId: answer._id,
                resourceType: 'answer'
            },
            content: {
                title: '答题反馈',
                message: analysisResult.feedback,
                structured: {
                    errorLocation: analysisResult.errorAnalysis?.errorLocation,
                    corrections: analysisResult.errorAnalysis ? [{
                        issue: analysisResult.errorAnalysis.errorType,
                        suggestion: analysisResult.errorAnalysis.correctionSuggestion,
                        priority: 'high'
                    }] : [],
                    improvements: analysisResult.suggestions?.map(s => ({
                        area: '答题技巧',
                        suggestion: s,
                        actionItems: [s]
                    })) || [],
                    strengths: analysisResult.strengths || [],
                    areasForImprovement: analysisResult.areasForImprovement || []
                }
            },
            aiGenerated: true,
            confidence: analysisResult.confidence,
            status: 'delivered',
            priority: analysisResult.isCorrect ? 'low' : 'medium'
        });

        await feedback.save();
    } catch (error) {
        console.error('生成反馈错误:', error);
    }
};

/**
 * 更新题目统计
 */
const updateQuestionStats = async (questionId) => {
    try {
        const stats = await Answer.aggregate([
            { $match: { question: questionId, status: 'graded' } },
            {
                $group: {
                    _id: null,
                    totalAnswers: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    correctCount: { $sum: { $cond: ['$isCorrect', 1, 0] } }
                }
            }
        ]);

        if (stats.length > 0) {
            const stat = stats[0];
            await Question.findByIdAndUpdate(questionId, {
                usageCount: stat.totalAnswers,
                averageScore: stat.averageScore
            });
        }
    } catch (error) {
        console.error('更新题目统计错误:', error);
    }
};

/**
 * 获取学生答案列表
 */
const getAnswers = async (req, res) => {
    try {
        const { studentId, examId, questionId, status, page = 1, limit = 10 } = req.query;

        const query = {};
        if (studentId) query.student = studentId;
        if (examId) query.exam = examId;
        if (questionId) query.question = questionId;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const answers = await Answer.find(query)
            .populate('student', 'name rollNum')
            .populate('exam', 'title')
            .populate('question', 'title content type difficulty points')
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Answer.countDocuments(query);

        res.json({
            data: answers,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取答案列表错误:', error);
        res.status(500).json({
            message: '获取答案列表失败',
            error: error.message
        });
    }
};

/**
 * 获取单个答案详情
 */
const getAnswerById = async (req, res) => {
    try {
        const { id } = req.params;

        const answer = await Answer.findById(id)
            .populate('student', 'name rollNum sclassName')
            .populate('exam', 'title subject')
            .populate('question', 'title content type difficulty points options correctAnswer explanation')
            .populate('manualReview.reviewedBy', 'name email');

        if (!answer) {
            return res.status(404).json({ message: '答案不存在' });
        }

        res.json({ data: answer });

    } catch (error) {
        console.error('获取答案详情错误:', error);
        res.status(500).json({
            message: '获取答案详情失败',
            error: error.message
        });
    }
};

/**
 * 人工评分
 */
const manualGrading = async (req, res) => {
    try {
        const { id } = req.params;
        const { manualScore, reviewComments, reviewedBy } = req.body;

        const answer = await Answer.findById(id);
        if (!answer) {
            return res.status(404).json({ message: '答案不存在' });
        }

        const updatedAnswer = await Answer.findByIdAndUpdate(
            id,
            {
                'manualReview.reviewed': true,
                'manualReview.reviewedBy': reviewedBy,
                'manualReview.reviewedAt': new Date(),
                'manualReview.manualScore': manualScore,
                'manualReview.reviewComments': reviewComments,
                score: manualScore, // 使用人工评分覆盖AI评分
                status: 'reviewed'
            },
            { new: true }
        )
        .populate('student', 'name rollNum')
        .populate('question', 'title content')
        .populate('manualReview.reviewedBy', 'name email');

        // 更新题目统计
        await updateQuestionStats(answer.question);

        res.json({
            message: '人工评分完成',
            data: updatedAnswer
        });

    } catch (error) {
        console.error('人工评分错误:', error);
        res.status(500).json({
            message: '人工评分失败',
            error: error.message
        });
    }
};

/**
 * 批量分析答案
 */
const batchAnalyzeAnswers = async (req, res) => {
    try {
        const { examId, questionId, forceReanalyze = false } = req.body;

        const query = { status: 'submitted' };
        if (examId) query.exam = examId;
        if (questionId) query.question = questionId;

        if (forceReanalyze) {
            query.status = { $in: ['submitted', 'graded'] };
        }

        const answers = await Answer.find(query);

        if (answers.length === 0) {
            return res.json({
                message: '没有需要分析的答案',
                processedCount: 0
            });
        }

        // 异步处理所有答案
        const analysisPromises = answers.map(answer => analyzeAnswerAsync(answer._id));
        
        // 不等待所有分析完成，立即返回
        Promise.all(analysisPromises).catch(error => {
            console.error('批量分析答案错误:', error);
        });

        res.json({
            message: `开始批量分析${answers.length}个答案`,
            processedCount: answers.length,
            status: 'processing'
        });

    } catch (error) {
        console.error('批量分析答案错误:', error);
        res.status(500).json({
            message: '批量分析答案失败',
            error: error.message
        });
    }
};

/**
 * 获取学生错误分析
 */
const getStudentErrorAnalysis = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, timeRange = 'month' } = req.query;

        // 构建时间范围查询
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

        const matchQuery = {
            student: studentId,
            status: { $in: ['graded', 'reviewed'] },
            submitTime: { $gte: startDate }
        };

        // 如果指定了科目，需要通过exam关联查询
        let pipeline = [
            { $match: matchQuery }
        ];

        if (subject) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'exams',
                        localField: 'exam',
                        foreignField: '_id',
                        as: 'examInfo'
                    }
                },
                {
                    $match: {
                        'examInfo.subject': subject
                    }
                }
            );
        }

        // 错误模式分析
        pipeline.push(
            {
                $match: {
                    isCorrect: false
                }
            },
            {
                $lookup: {
                    from: 'questions',
                    localField: 'question',
                    foreignField: '_id',
                    as: 'questionInfo'
                }
            },
            {
                $unwind: '$questionInfo'
            },
            {
                $group: {
                    _id: {
                        errorType: '$aiEvaluation.errorAnalysis.errorType',
                        knowledgePoint: { $arrayElemAt: ['$questionInfo.knowledgePoints', 0] },
                        questionType: '$questionInfo.type',
                        difficulty: '$questionInfo.difficulty'
                    },
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    suggestions: { $push: '$aiEvaluation.suggestions' },
                    examples: {
                        $push: {
                            question: '$questionInfo.title',
                            answer: '$answer',
                            feedback: '$aiEvaluation.feedback'
                        }
                    }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 20
            }
        );

        const errorAnalysis = await Answer.aggregate(pipeline);

        // 知识点掌握情况分析
        const knowledgePointAnalysis = await Answer.aggregate([
            { $match: { student: studentId, submitTime: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'questions',
                    localField: 'question',
                    foreignField: '_id',
                    as: 'questionInfo'
                }
            },
            { $unwind: '$questionInfo' },
            { $unwind: '$questionInfo.knowledgePoints' },
            {
                $group: {
                    _id: '$questionInfo.knowledgePoints',
                    totalQuestions: { $sum: 1 },
                    correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                    averageScore: { $avg: '$score' },
                    averageTime: { $avg: '$timeSpent' }
                }
            },
            {
                $addFields: {
                    masteryRate: { $divide: ['$correctAnswers', '$totalQuestions'] }
                }
            },
            { $sort: { masteryRate: 1 } }
        ]);

        // 生成改进建议
        const improvementSuggestions = await generateImprovementSuggestions(studentId, errorAnalysis, knowledgePointAnalysis);

        res.json({
            studentId,
            timeRange,
            errorPatterns: errorAnalysis,
            knowledgePointMastery: knowledgePointAnalysis,
            improvementSuggestions,
            analysisDate: new Date()
        });

    } catch (error) {
        console.error('获取学生错误分析错误:', error);
        res.status(500).json({
            message: '获取学生错误分析失败',
            error: error.message
        });
    }
};

/**
 * 生成改进建议
 */
const generateImprovementSuggestions = async (studentId, errorAnalysis, knowledgePointAnalysis) => {
    try {
        // 找出最需要改进的知识点
        const weakKnowledgePoints = knowledgePointAnalysis
            .filter(kp => kp.masteryRate < 0.6)
            .slice(0, 5);

        // 找出最常见的错误类型
        const commonErrors = errorAnalysis.slice(0, 3);

        const suggestions = [];

        // 基于薄弱知识点的建议
        weakKnowledgePoints.forEach(kp => {
            suggestions.push({
                type: 'knowledge_point',
                priority: 'high',
                title: `加强${kp._id}的学习`,
                description: `该知识点掌握率仅为${Math.round(kp.masteryRate * 100)}%，建议重点复习`,
                actionItems: [
                    '复习相关理论知识',
                    '完成针对性练习题',
                    '寻求教师或同学帮助'
                ],
                resources: []
            });
        });

        // 基于错误模式的建议
        commonErrors.forEach(error => {
            if (error._id.errorType) {
                suggestions.push({
                    type: 'error_pattern',
                    priority: 'medium',
                    title: `改善${error._id.errorType}问题`,
                    description: `该类型错误出现${error.count}次，需要重点关注`,
                    actionItems: error.suggestions[0] || [],
                    resources: []
                });
            }
        });

        return suggestions;

    } catch (error) {
        console.error('生成改进建议错误:', error);
        return [];
    }
};

module.exports = {
    submitAnswer,
    getAnswers,
    getAnswerById,
    manualGrading,
    batchAnalyzeAnswers,
    getStudentErrorAnalysis,
    analyzeAnswerAsync
};
