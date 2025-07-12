const Question = require('../models/questionSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 创建题目
 */
const createQuestion = async (req, res) => {
    try {
        const {
            title,
            content,
            type,
            subject,
            sclass,
            school,
            createdBy,
            difficulty,
            points,
            options,
            correctAnswer,
            codingDetails,
            knowledgePoints,
            explanation,
            hints
        } = req.body;

        const question = new Question({
            title,
            content,
            type,
            subject,
            sclass,
            school,
            createdBy,
            difficulty: difficulty || 'medium',
            points: points || 1,
            options: options || [],
            correctAnswer,
            codingDetails,
            knowledgePoints: knowledgePoints || [],
            explanation,
            hints: hints || []
        });

        const savedQuestion = await question.save();
        
        const populatedQuestion = await Question.findById(savedQuestion._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email');

        res.status(201).json({
            message: '题目创建成功',
            data: populatedQuestion
        });

    } catch (error) {
        console.error('创建题目错误:', error);
        res.status(500).json({
            message: '创建题目失败',
            error: error.message
        });
    }
};

/**
 * AI生成题目
 */
const generateQuestions = async (req, res) => {
    try {
        const {
            subject,
            sclass,
            school,
            createdBy,
            difficulty,
            questionCount,
            questionTypes,
            knowledgePoints,
            duration,
            examType,
            customRequirements
        } = req.body;

        // 获取相关知识库内容
        const knowledgeBase = await KnowledgeBase.find({
            subject: subject,
            school: school,
            isActive: true,
            tags: { $in: knowledgePoints }
        }).limit(20);

        // 获取科目信息
        const subjectInfo = await Subject.findById(subject).select('subName subCode');
        const classInfo = await require('../models/sclassSchema').findById(sclass).select('sclassName');

        // 构建考试配置
        const examConfig = {
            subject: subjectInfo.subName,
            grade: classInfo.sclassName,
            difficulty,
            questionCount,
            questionTypes,
            knowledgePoints,
            duration,
            examType: examType || 'quiz',
            customRequirements: customRequirements || '',
            knowledgeBaseContent: knowledgeBase.map(kb => ({
                title: kb.title,
                content: kb.content.substring(0, 500),
                tags: kb.tags
            }))
        };

        // 调用AI服务生成题目
        const aiResult = await aiService.generateExamQuestions(examConfig);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'AI生成题目失败',
                error: aiResult.error
            });
        }

        // 解析AI响应
        const parsedResult = AIResponseParser.parseQuestions(aiResult.answer);

        if (!parsedResult.success) {
            return res.status(500).json({
                message: '解析AI响应失败',
                error: parsedResult.error,
                rawResponse: aiResult.answer
            });
        }

        // 批量创建题目
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
            codingDetails: q.codingDetails,
            knowledgePoints: q.knowledgePoints,
            explanation: q.explanation,
            hints: q.hints || [],
            aiGenerated: true,
            aiPrompt: JSON.stringify(examConfig)
        }));

        const savedQuestions = await Question.insertMany(questionsToSave);
        
        // 填充关联数据
        const populatedQuestions = await Question.find({
            _id: { $in: savedQuestions.map(q => q._id) }
        })
        .populate('subject', 'subName subCode')
        .populate('sclass', 'sclassName')
        .populate('createdBy', 'name email');

        res.status(201).json({
            message: `AI成功生成${savedQuestions.length}道题目`,
            data: populatedQuestions,
            aiMetadata: {
                generatedAt: new Date(),
                confidence: aiResult.confidence || 0.8,
                needsReview: parsedResult.needsReview || false,
                originalRequest: examConfig
            }
        });

    } catch (error) {
        console.error('AI生成题目错误:', error);
        res.status(500).json({
            message: 'AI生成题目失败',
            error: error.message
        });
    }
};

/**
 * 获取题目列表
 */
const getQuestions = async (req, res) => {
    try {
        const { 
            subject, 
            type, 
            difficulty, 
            createdBy, 
            knowledgePoint,
            page = 1, 
            limit = 10 
        } = req.query;
        const { adminID } = req.params;

        const query = { school: adminID, isActive: true };
        
        if (subject) query.subject = subject;
        if (type) query.type = type;
        if (difficulty) query.difficulty = difficulty;
        if (createdBy) query.createdBy = createdBy;
        if (knowledgePoint) query.knowledgePoints = { $in: [knowledgePoint] };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const questions = await Question.find(query)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Question.countDocuments(query);

        res.json({
            data: questions,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取题目列表错误:', error);
        res.status(500).json({
            message: '获取题目列表失败',
            error: error.message
        });
    }
};

/**
 * 获取单个题目
 */
const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findById(id)
            .populate('subject', 'subName subCode sessions')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email')
            .populate('school', 'schoolName');

        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }

        // 增加使用次数
        await Question.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });

        res.json({ data: question });

    } catch (error) {
        console.error('获取题目错误:', error);
        res.status(500).json({
            message: '获取题目失败',
            error: error.message
        });
    }
};

/**
 * 更新题目
 */
const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 移除不应该被更新的字段
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.usageCount;
        delete updateData.averageScore;

        const question = await Question.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('subject', 'subName subCode')
        .populate('sclass', 'sclassName')
        .populate('createdBy', 'name email');

        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }

        res.json({
            message: '题目更新成功',
            data: question
        });

    } catch (error) {
        console.error('更新题目错误:', error);
        res.status(500).json({
            message: '更新题目失败',
            error: error.message
        });
    }
};

/**
 * 删除题目
 */
const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }

        res.json({ message: '题目删除成功' });

    } catch (error) {
        console.error('删除题目错误:', error);
        res.status(500).json({
            message: '删除题目失败',
            error: error.message
        });
    }
};

/**
 * 批量删除题目
 */
const deleteQuestions = async (req, res) => {
    try {
        const { questionIds } = req.body;

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ message: '请提供有效的题目ID列表' });
        }

        const result = await Question.updateMany(
            { _id: { $in: questionIds } },
            { isActive: false }
        );

        res.json({
            message: `成功删除${result.modifiedCount}道题目`,
            deletedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('批量删除题目错误:', error);
        res.status(500).json({
            message: '批量删除题目失败',
            error: error.message
        });
    }
};

/**
 * 复制题目
 */
const duplicateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { newTitle } = req.body;

        const originalQuestion = await Question.findById(id);
        if (!originalQuestion) {
            return res.status(404).json({ message: '原题目不存在' });
        }

        const duplicatedQuestion = new Question({
            ...originalQuestion.toObject(),
            _id: undefined,
            title: newTitle || `${originalQuestion.title} (副本)`,
            usageCount: 0,
            averageScore: 0,
            aiGenerated: false,
            createdAt: undefined,
            updatedAt: undefined
        });

        const savedQuestion = await duplicatedQuestion.save();
        
        const populatedQuestion = await Question.findById(savedQuestion._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email');

        res.status(201).json({
            message: '题目复制成功',
            data: populatedQuestion
        });

    } catch (error) {
        console.error('复制题目错误:', error);
        res.status(500).json({
            message: '复制题目失败',
            error: error.message
        });
    }
};

/**
 * 获取题目统计
 */
const getQuestionStats = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { teacherId, subject, timeRange } = req.query;

        const query = { school: adminID, isActive: true };
        if (teacherId) query.createdBy = teacherId;
        if (subject) query.subject = subject;

        // 时间范围过滤
        if (timeRange) {
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
            
            query.createdAt = { $gte: startDate };
        }

        // 题目类型统计
        const typeStats = await Question.aggregate([
            { $match: query },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // 难度分布统计
        const difficultyStats = await Question.aggregate([
            { $match: query },
            { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ]);

        // AI生成统计
        const aiStats = await Question.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$aiGenerated',
                    count: { $sum: 1 },
                    avgUsage: { $avg: '$usageCount' },
                    avgScore: { $avg: '$averageScore' }
                }
            }
        ]);

        // 知识点覆盖统计
        const knowledgePointStats = await Question.aggregate([
            { $match: query },
            { $unwind: '$knowledgePoints' },
            { $group: { _id: '$knowledgePoints', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        // 总体统计
        const totalCount = await Question.countDocuments(query);
        const avgUsage = await Question.aggregate([
            { $match: query },
            { $group: { _id: null, avgUsage: { $avg: '$usageCount' } } }
        ]);

        res.json({
            overview: {
                totalQuestions: totalCount,
                averageUsage: avgUsage[0]?.avgUsage || 0,
                typeDistribution: typeStats,
                difficultyDistribution: difficultyStats,
                aiGeneratedStats: aiStats
            },
            knowledgePointCoverage: knowledgePointStats,
            timeRange: timeRange || 'month'
        });

    } catch (error) {
        console.error('获取题目统计错误:', error);
        res.status(500).json({
            message: '获取题目统计失败',
            error: error.message
        });
    }
};

module.exports = {
    createQuestion,
    generateQuestions,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    deleteQuestions,
    duplicateQuestion,
    getQuestionStats
};
