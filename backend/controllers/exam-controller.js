const Exam = require('../models/examSchema');
const Question = require('../models/questionSchema');
const Answer = require('../models/answerSchema');
const Subject = require('../models/subjectSchema');
const Student = require('../models/studentSchema');
const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 创建考试
 */
const createExam = async (req, res) => {
    try {
        const {
            title,
            description,
            subject,
            sclass,
            school,
            createdBy,
            startTime,
            endTime,
            duration,
            questions,
            settings
        } = req.body;

        // 计算总分
        const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

        const exam = new Exam({
            title,
            description,
            subject,
            sclass,
            school,
            createdBy,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration,
            questions: questions.map((q, index) => ({
                question: q.questionId || q.question,
                points: q.points || 1,
                order: q.order || index + 1
            })),
            totalPoints,
            settings: {
                shuffleQuestions: settings?.shuffleQuestions || false,
                shuffleOptions: settings?.shuffleOptions || false,
                allowReview: settings?.allowReview !== false,
                showResultsImmediately: settings?.showResultsImmediately || false,
                allowMultipleAttempts: settings?.allowMultipleAttempts || false,
                maxAttempts: settings?.maxAttempts || 1,
                passingScore: settings?.passingScore || 60
            }
        });

        const savedExam = await exam.save();
        
        const populatedExam = await Exam.findById(savedExam._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email')
            .populate('questions.question', 'title content type difficulty points');

        res.status(201).json({
            message: '考试创建成功',
            data: populatedExam
        });

    } catch (error) {
        console.error('创建考试错误:', error);
        res.status(500).json({
            message: '创建考试失败',
            error: error.message
        });
    }
};

/**
 * AI生成考试
 */
const generateExam = async (req, res) => {
    try {
        const {
            title,
            description,
            subject,
            sclass,
            school,
            createdBy,
            startTime,
            endTime,
            duration,
            examConfig
        } = req.body;

        // 使用AI生成题目
        const aiResult = await aiService.generateExamQuestions(examConfig);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'AI生成考试题目失败',
                error: aiResult.error
            });
        }

        // 解析AI响应
        const parsedResult = AIResponseParser.parseQuestions(aiResult.answer);

        if (!parsedResult.success) {
            return res.status(500).json({
                message: '解析AI响应失败',
                error: parsedResult.error
            });
        }

        // 创建题目
        const questionsToSave = parsedResult.data.map(q => ({
            title: q.title,
            content: q.content,
            type: q.type,
            subject,
            sclass,
            school,
            createdBy,
            difficulty: q.difficulty,
            points: q.points,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            knowledgePoints: q.knowledgePoints,
            aiGenerated: true,
            aiPrompt: JSON.stringify(examConfig)
        }));

        const savedQuestions = await Question.insertMany(questionsToSave);

        // 创建考试
        const totalPoints = savedQuestions.reduce((sum, q) => sum + q.points, 0);

        const exam = new Exam({
            title,
            description,
            subject,
            sclass,
            school,
            createdBy,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration,
            questions: savedQuestions.map((q, index) => ({
                question: q._id,
                points: q.points,
                order: index + 1
            })),
            totalPoints,
            aiGenerated: true,
            generationPrompt: JSON.stringify(examConfig),
            settings: {
                shuffleQuestions: examConfig.shuffleQuestions || false,
                shuffleOptions: examConfig.shuffleOptions || false,
                allowReview: true,
                showResultsImmediately: false,
                allowMultipleAttempts: false,
                maxAttempts: 1,
                passingScore: examConfig.passingScore || 60
            }
        });

        const savedExam = await exam.save();
        
        const populatedExam = await Exam.findById(savedExam._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email')
            .populate('questions.question', 'title content type difficulty points options correctAnswer');

        res.status(201).json({
            message: `AI成功生成考试，包含${savedQuestions.length}道题目`,
            data: populatedExam,
            aiMetadata: {
                generatedAt: new Date(),
                questionsGenerated: savedQuestions.length,
                totalPoints,
                confidence: aiResult.confidence || 0.8
            }
        });

    } catch (error) {
        console.error('AI生成考试错误:', error);
        res.status(500).json({
            message: 'AI生成考试失败',
            error: error.message
        });
    }
};

/**
 * 获取考试列表
 */
const getExams = async (req, res) => {
    try {
        const { 
            subject, 
            status, 
            createdBy,
            page = 1, 
            limit = 10 
        } = req.query;
        const { adminID } = req.params;

        const query = { school: adminID };
        
        if (subject) query.subject = subject;
        if (status) query.status = status;
        if (createdBy) query.createdBy = createdBy;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const exams = await Exam.find(query)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Exam.countDocuments(query);

        res.json({
            data: exams,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取考试列表错误:', error);
        res.status(500).json({
            message: '获取考试列表失败',
            error: error.message
        });
    }
};

/**
 * 获取单个考试详情
 */
const getExamById = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeAnswers = false } = req.query;

        let populateFields = [
            { path: 'subject', select: 'subName subCode sessions' },
            { path: 'sclass', select: 'sclassName' },
            { path: 'createdBy', select: 'name email' },
            { path: 'school', select: 'schoolName' }
        ];

        if (includeAnswers === 'true') {
            populateFields.push({
                path: 'questions.question',
                select: 'title content type difficulty points options correctAnswer explanation hints'
            });
        } else {
            populateFields.push({
                path: 'questions.question',
                select: 'title content type difficulty points options' // 不包含正确答案
            });
        }

        const exam = await Exam.findById(id).populate(populateFields);

        if (!exam) {
            return res.status(404).json({ message: '考试不存在' });
        }

        res.json({ data: exam });

    } catch (error) {
        console.error('获取考试详情错误:', error);
        res.status(500).json({
            message: '获取考试详情失败',
            error: error.message
        });
    }
};

/**
 * 更新考试
 */
const updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 移除不应该被更新的字段
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.statistics;

        // 如果更新了题目，重新计算总分
        if (updateData.questions) {
            updateData.totalPoints = updateData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        }

        const exam = await Exam.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('subject', 'subName subCode')
        .populate('sclass', 'sclassName')
        .populate('createdBy', 'name email')
        .populate('questions.question', 'title content type difficulty points');

        if (!exam) {
            return res.status(404).json({ message: '考试不存在' });
        }

        res.json({
            message: '考试更新成功',
            data: exam
        });

    } catch (error) {
        console.error('更新考试错误:', error);
        res.status(500).json({
            message: '更新考试失败',
            error: error.message
        });
    }
};

/**
 * 删除考试
 */
const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;

        const exam = await Exam.findByIdAndDelete(id);

        if (!exam) {
            return res.status(404).json({ message: '考试不存在' });
        }

        // 同时删除相关的答案记录
        await Answer.deleteMany({ exam: id });

        res.json({ message: '考试删除成功' });

    } catch (error) {
        console.error('删除考试错误:', error);
        res.status(500).json({
            message: '删除考试失败',
            error: error.message
        });
    }
};

/**
 * 更新考试状态
 */
const updateExamStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'published', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: '无效的状态值' });
        }

        const exam = await Exam.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
        .populate('subject', 'subName subCode')
        .populate('createdBy', 'name email');

        if (!exam) {
            return res.status(404).json({ message: '考试不存在' });
        }

        res.json({
            message: '考试状态更新成功',
            data: exam
        });

    } catch (error) {
        console.error('更新考试状态错误:', error);
        res.status(500).json({
            message: '更新考试状态失败',
            error: error.message
        });
    }
};

/**
 * 获取考试统计信息
 */
const getExamStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: '考试不存在' });
        }

        // 获取参与统计
        const participationStats = await Answer.aggregate([
            { $match: { exam: exam._id } },
            {
                $group: {
                    _id: '$student',
                    totalScore: { $sum: '$score' },
                    maxScore: { $sum: '$maxScore' },
                    questionsAnswered: { $sum: 1 },
                    averageTime: { $avg: '$timeSpent' }
                }
            }
        ]);

        // 计算整体统计
        const totalStudents = await Student.countDocuments({ sclassName: exam.sclass });
        const participatedStudents = participationStats.length;
        const completionRate = totalStudents > 0 ? (participatedStudents / totalStudents) * 100 : 0;

        const scores = participationStats.map(p => (p.totalScore / p.maxScore) * 100);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const passRate = scores.filter(score => score >= exam.settings.passingScore).length / scores.length * 100;

        // 题目难度分析
        const questionStats = await Answer.aggregate([
            { $match: { exam: exam._id } },
            {
                $group: {
                    _id: '$question',
                    correctCount: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                    totalCount: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    averageTime: { $avg: '$timeSpent' }
                }
            },
            {
                $addFields: {
                    correctRate: { $divide: ['$correctCount', '$totalCount'] }
                }
            }
        ]);

        // 更新考试统计
        await Exam.findByIdAndUpdate(id, {
            'statistics.totalAttempts': participatedStudents,
            'statistics.averageScore': averageScore,
            'statistics.passRate': passRate,
            'statistics.completionRate': completionRate
        });

        res.json({
            overview: {
                totalStudents,
                participatedStudents,
                completionRate: Math.round(completionRate * 100) / 100,
                averageScore: Math.round(averageScore * 100) / 100,
                passRate: Math.round(passRate * 100) / 100
            },
            scoreDistribution: scores,
            questionAnalysis: questionStats,
            participationDetails: participationStats
        });

    } catch (error) {
        console.error('获取考试统计错误:', error);
        res.status(500).json({
            message: '获取考试统计失败',
            error: error.message
        });
    }
};

/**
 * 复制考试
 */
const duplicateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { newTitle, newStartTime, newEndTime } = req.body;

        const originalExam = await Exam.findById(id);
        if (!originalExam) {
            return res.status(404).json({ message: '原考试不存在' });
        }

        const duplicatedExam = new Exam({
            ...originalExam.toObject(),
            _id: undefined,
            title: newTitle || `${originalExam.title} (副本)`,
            startTime: newStartTime ? new Date(newStartTime) : new Date(),
            endTime: newEndTime ? new Date(newEndTime) : new Date(Date.now() + originalExam.duration * 60000),
            status: 'draft',
            statistics: {
                totalAttempts: 0,
                averageScore: 0,
                passRate: 0,
                completionRate: 0
            },
            createdAt: undefined,
            updatedAt: undefined
        });

        const savedExam = await duplicatedExam.save();
        
        const populatedExam = await Exam.findById(savedExam._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email');

        res.status(201).json({
            message: '考试复制成功',
            data: populatedExam
        });

    } catch (error) {
        console.error('复制考试错误:', error);
        res.status(500).json({
            message: '复制考试失败',
            error: error.message
        });
    }
};

module.exports = {
    createExam,
    generateExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam,
    updateExamStatus,
    getExamStatistics,
    duplicateExam
};
