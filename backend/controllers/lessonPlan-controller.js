const LessonPlan = require('../models/lessonPlanSchema');
const CourseContent = require('../models/courseContentSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 创建教学计划
 */
const createLessonPlan = async (req, res) => {
    try {
        const {
            title,
            courseContent,
            subject,
            sclass,
            teacher,
            school,
            scheduledDate,
            duration,
            activities,
            knowledgePoints,
            practicalExercises
        } = req.body;

        const lessonPlan = new LessonPlan({
            title,
            courseContent,
            subject,
            sclass,
            teacher,
            school,
            scheduledDate: new Date(scheduledDate),
            duration,
            activities: activities || [],
            knowledgePoints: knowledgePoints || [],
            practicalExercises: practicalExercises || [],
            status: 'draft'
        });

        const savedLessonPlan = await lessonPlan.save();
        
        const populatedPlan = await LessonPlan.findById(savedLessonPlan._id)
            .populate('courseContent', 'title description')
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name email')
            .populate('school', 'schoolName');

        res.status(201).json({
            message: '教学计划创建成功',
            data: populatedPlan
        });

    } catch (error) {
        console.error('创建教学计划错误:', error);
        res.status(500).json({
            message: '创建教学计划失败',
            error: error.message
        });
    }
};

/**
 * AI生成教学计划
 */
const generateLessonPlan = async (req, res) => {
    try {
        const {
            subject,
            sclass,
            teacher,
            school,
            courseOutline,
            learningObjectives,
            duration,
            difficulty,
            contentType
        } = req.body;

        // 获取相关知识库内容
        const knowledgeBase = await KnowledgeBase.find({
            subject: subject,
            school: school,
            isActive: true
        }).limit(10);

        // 构建课程信息
        const courseInfo = {
            subject: await Subject.findById(subject).select('subName'),
            grade: await require('../models/sclassSchema').findById(sclass).select('sclassName'),
            duration,
            objectives: learningObjectives,
            outline: courseOutline,
            difficulty,
            contentType
        };

        // 调用AI服务生成教学计划
        const aiResult = await aiService.generateLessonPlan(courseInfo, knowledgeBase);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'AI生成教学计划失败',
                error: aiResult.error
            });
        }

        // 解析AI响应
        const parsedResult = AIResponseParser.parseLessonPlan(aiResult.answer);

        if (!parsedResult.success) {
            return res.status(500).json({
                message: '解析AI响应失败',
                error: parsedResult.error
            });
        }

        // 创建教学计划记录
        const lessonPlan = new LessonPlan({
            title: parsedResult.data.title,
            subject,
            sclass,
            teacher,
            school,
            scheduledDate: new Date(),
            duration: parsedResult.data.duration,
            activities: parsedResult.data.activities,
            knowledgePoints: parsedResult.data.knowledgePoints,
            practicalExercises: parsedResult.data.practicalExercises,
            aiGenerated: true,
            aiPrompt: JSON.stringify(courseInfo),
            status: 'draft'
        });

        const savedLessonPlan = await lessonPlan.save();
        
        const populatedPlan = await LessonPlan.findById(savedLessonPlan._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name email')
            .populate('school', 'schoolName');

        res.status(201).json({
            message: 'AI教学计划生成成功',
            data: populatedPlan,
            aiMetadata: {
                generatedAt: new Date(),
                confidence: aiResult.confidence || 0.8,
                needsReview: parsedResult.needsReview || false
            }
        });

    } catch (error) {
        console.error('AI生成教学计划错误:', error);
        res.status(500).json({
            message: 'AI生成教学计划失败',
            error: error.message
        });
    }
};

/**
 * 获取教学计划列表
 */
const getLessonPlans = async (req, res) => {
    try {
        const { teacherId, subjectId, status, page = 1, limit = 10 } = req.query;
        const { adminID } = req.params;

        const query = { school: adminID };
        
        if (teacherId) query.teacher = teacherId;
        if (subjectId) query.subject = subjectId;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const lessonPlans = await LessonPlan.find(query)
            .populate('courseContent', 'title description')
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name email')
            .sort({ scheduledDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LessonPlan.countDocuments(query);

        res.json({
            data: lessonPlans,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取教学计划列表错误:', error);
        res.status(500).json({
            message: '获取教学计划列表失败',
            error: error.message
        });
    }
};

/**
 * 获取单个教学计划
 */
const getLessonPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const lessonPlan = await LessonPlan.findById(id)
            .populate('courseContent', 'title description outline learningObjectives')
            .populate('subject', 'subName subCode sessions')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name email')
            .populate('school', 'schoolName');

        if (!lessonPlan) {
            return res.status(404).json({ message: '教学计划不存在' });
        }

        res.json({ data: lessonPlan });

    } catch (error) {
        console.error('获取教学计划错误:', error);
        res.status(500).json({
            message: '获取教学计划失败',
            error: error.message
        });
    }
};

/**
 * 更新教学计划
 */
const updateLessonPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 移除不应该被更新的字段
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const lessonPlan = await LessonPlan.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('subject', 'subName subCode')
         .populate('sclass', 'sclassName')
         .populate('teacher', 'name email');

        if (!lessonPlan) {
            return res.status(404).json({ message: '教学计划不存在' });
        }

        res.json({
            message: '教学计划更新成功',
            data: lessonPlan
        });

    } catch (error) {
        console.error('更新教学计划错误:', error);
        res.status(500).json({
            message: '更新教学计划失败',
            error: error.message
        });
    }
};

/**
 * 删除教学计划
 */
const deleteLessonPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const lessonPlan = await LessonPlan.findByIdAndDelete(id);

        if (!lessonPlan) {
            return res.status(404).json({ message: '教学计划不存在' });
        }

        res.json({ message: '教学计划删除成功' });

    } catch (error) {
        console.error('删除教学计划错误:', error);
        res.status(500).json({
            message: '删除教学计划失败',
            error: error.message
        });
    }
};

/**
 * 更新教学计划状态
 */
const updateLessonPlanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;

        const validStatuses = ['draft', 'ready', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: '无效的状态值' });
        }

        const updateData = { status };
        if (feedback) {
            updateData.feedback = feedback;
        }

        const lessonPlan = await LessonPlan.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('subject', 'subName subCode')
         .populate('teacher', 'name email');

        if (!lessonPlan) {
            return res.status(404).json({ message: '教学计划不存在' });
        }

        res.json({
            message: '教学计划状态更新成功',
            data: lessonPlan
        });

    } catch (error) {
        console.error('更新教学计划状态错误:', error);
        res.status(500).json({
            message: '更新教学计划状态失败',
            error: error.message
        });
    }
};

/**
 * 复制教学计划
 */
const duplicateLessonPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { newTitle, newScheduledDate } = req.body;

        const originalPlan = await LessonPlan.findById(id);
        if (!originalPlan) {
            return res.status(404).json({ message: '原教学计划不存在' });
        }

        const duplicatedPlan = new LessonPlan({
            ...originalPlan.toObject(),
            _id: undefined,
            title: newTitle || `${originalPlan.title} (副本)`,
            scheduledDate: newScheduledDate ? new Date(newScheduledDate) : new Date(),
            status: 'draft',
            createdAt: undefined,
            updatedAt: undefined
        });

        const savedPlan = await duplicatedPlan.save();
        
        const populatedPlan = await LessonPlan.findById(savedPlan._id)
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name email');

        res.status(201).json({
            message: '教学计划复制成功',
            data: populatedPlan
        });

    } catch (error) {
        console.error('复制教学计划错误:', error);
        res.status(500).json({
            message: '复制教学计划失败',
            error: error.message
        });
    }
};

/**
 * 获取教学计划统计
 */
const getLessonPlanStats = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { teacherId, timeRange } = req.query;

        const query = { school: adminID };
        if (teacherId) query.teacher = teacherId;

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

        // 状态统计
        const statusStats = await LessonPlan.aggregate([
            { $match: query },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // AI生成统计
        const aiStats = await LessonPlan.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$aiGenerated',
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$duration' }
                }
            }
        ]);

        // 按科目统计
        const subjectStats = await LessonPlan.aggregate([
            { $match: query },
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            }
        ]);

        // 总体统计
        const totalCount = await LessonPlan.countDocuments(query);

        res.json({
            overview: {
                totalPlans: totalCount,
                statusDistribution: statusStats,
                aiGeneratedStats: aiStats
            },
            subjectDistribution: subjectStats,
            timeRange: timeRange || 'month'
        });

    } catch (error) {
        console.error('获取教学计划统计错误:', error);
        res.status(500).json({
            message: '获取教学计划统计失败',
            error: error.message
        });
    }
};

module.exports = {
    createLessonPlan,
    generateLessonPlan,
    getLessonPlans,
    getLessonPlanById,
    updateLessonPlan,
    deleteLessonPlan,
    updateLessonPlanStatus,
    duplicateLessonPlan,
    getLessonPlanStats
};
