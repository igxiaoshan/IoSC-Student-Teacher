/**
 * AI功能相关路由
 * 集成Dify + Ollama DeepSeek-R1模型的智能功能
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// 导入服务和模型
const difyService = require('../services/difyService');
const LearningRecord = require('../models/learningRecordSchema');
const CourseResource = require('../models/courseResourceSchema');
const ExerciseBank = require('../models/exerciseBankSchema');
const UsageStats = require('../models/usageStatsSchema');

// API调用频率限制
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 50, // 每15分钟最多50次请求
    message: {
        error: 'AI服务调用过于频繁，请稍后再试',
        retryAfter: '15分钟'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 应用频率限制到所有AI路由
router.use(aiRateLimit);

// ==================== 学生侧AI功能 ====================

/**
 * 学生学习问答助手
 * POST /api/ai/student/ask-question
 */
router.post('/student/ask-question', async (req, res) => {
    try {
        const { question, subject, studentId } = req.body;
        
        if (!question || !studentId) {
            return res.status(400).json({
                success: false,
                error: '问题内容和学生ID不能为空'
            });
        }

        const startTime = Date.now();
        
        // 调用AI服务
        const aiResponse = await difyService.studentAskQuestion(question, studentId, subject);
        
        const responseTime = Date.now() - startTime;
        
        if (aiResponse.success) {
            // 保存学习记录
            const learningRecord = new LearningRecord({
                studentId: studentId,
                subject: subject || '通用',
                questionType: '学习问答',
                question: question,
                aiResponse: aiResponse.data.answer,
                conversationId: aiResponse.data.conversationId,
                messageId: aiResponse.data.messageId,
                studyDuration: Math.round(responseTime / 1000)
            });
            
            await learningRecord.save();
            
            // 记录使用统计
            await UsageStats.recordUsage(
                studentId, 
                'student', 
                'learning_assistant',
                Math.round(responseTime / 1000),
                {
                    aiInteractions: 1,
                    successfulOperations: 1,
                    responseTime: responseTime
                }
            );
            
            res.json({
                success: true,
                data: {
                    answer: aiResponse.data.answer,
                    conversationId: aiResponse.data.conversationId,
                    recordId: learningRecord._id
                }
            });
        } else {
            // 记录失败统计
            await UsageStats.recordUsage(
                studentId, 
                'student', 
                'learning_assistant',
                0,
                {
                    failedOperations: 1,
                    responseTime: responseTime
                }
            );
            
            res.status(500).json({
                success: false,
                error: aiResponse.error || 'AI服务暂时不可用'
            });
        }
        
    } catch (error) {
        console.error('学生问答服务错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 生成练习题
 * POST /api/ai/student/generate-exercise
 */
router.post('/student/generate-exercise', async (req, res) => {
    try {
        const { requirements, subject, studentId, difficulty } = req.body;
        
        if (!requirements || !studentId) {
            return res.status(400).json({
                success: false,
                error: '练习要求和学生ID不能为空'
            });
        }

        const startTime = Date.now();
        
        // 调用AI服务生成练习
        const aiResponse = await difyService.generateExercise(requirements, studentId, subject);
        
        const responseTime = Date.now() - startTime;
        
        if (aiResponse.success) {
            // 保存学习记录
            const learningRecord = new LearningRecord({
                studentId: studentId,
                subject: subject || '通用',
                questionType: '练习题目',
                question: requirements,
                aiResponse: aiResponse.data.answer,
                difficulty: difficulty || 3,
                conversationId: aiResponse.data.conversationId,
                messageId: aiResponse.data.messageId,
                studyDuration: Math.round(responseTime / 1000)
            });
            
            await learningRecord.save();
            
            // 记录使用统计
            await UsageStats.recordUsage(
                studentId, 
                'student', 
                'exercise_generator',
                Math.round(responseTime / 1000),
                {
                    aiInteractions: 1,
                    successfulOperations: 1,
                    responseTime: responseTime
                }
            );
            
            res.json({
                success: true,
                data: {
                    exercises: aiResponse.data.answer,
                    conversationId: aiResponse.data.conversationId,
                    recordId: learningRecord._id
                }
            });
        } else {
            await UsageStats.recordUsage(
                studentId, 
                'student', 
                'exercise_generator',
                0,
                { failedOperations: 1, responseTime: responseTime }
            );
            
            res.status(500).json({
                success: false,
                error: aiResponse.error || 'AI服务暂时不可用'
            });
        }
        
    } catch (error) {
        console.error('练习生成服务错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 检查学生答案
 * POST /api/ai/student/check-answer
 */
router.post('/student/check-answer', async (req, res) => {
    try {
        const { question, studentAnswer, correctAnswer, studentId } = req.body;
        
        if (!question || !studentAnswer || !studentId) {
            return res.status(400).json({
                success: false,
                error: '题目、学生答案和学生ID不能为空'
            });
        }

        const startTime = Date.now();
        
        // 调用AI服务检查答案
        const aiResponse = await difyService.checkStudentAnswer(question, studentAnswer, correctAnswer);
        
        const responseTime = Date.now() - startTime;
        
        if (aiResponse.success) {
            // 分析AI回复判断是否正确
            const isCorrect = aiResponse.data.answer.toLowerCase().includes('正确') || 
                             aiResponse.data.answer.toLowerCase().includes('对的');
            
            // 保存学习记录
            const learningRecord = new LearningRecord({
                studentId: studentId,
                subject: req.body.subject || '通用',
                questionType: '答案检查',
                question: question,
                studentAnswer: studentAnswer,
                aiResponse: aiResponse.data.answer,
                isCorrect: isCorrect,
                conversationId: aiResponse.data.conversationId,
                messageId: aiResponse.data.messageId,
                studyDuration: Math.round(responseTime / 1000)
            });
            
            await learningRecord.save();
            
            // 记录使用统计
            await UsageStats.recordUsage(
                studentId, 
                'student', 
                'answer_checker',
                Math.round(responseTime / 1000),
                {
                    aiInteractions: 1,
                    successfulOperations: 1,
                    responseTime: responseTime
                }
            );
            
            res.json({
                success: true,
                data: {
                    feedback: aiResponse.data.answer,
                    isCorrect: isCorrect,
                    conversationId: aiResponse.data.conversationId,
                    recordId: learningRecord._id
                }
            });
        } else {
            await UsageStats.recordUsage(
                studentId, 
                'student', 
                'answer_checker',
                0,
                { failedOperations: 1, responseTime: responseTime }
            );
            
            res.status(500).json({
                success: false,
                error: aiResponse.error || 'AI服务暂时不可用'
            });
        }
        
    } catch (error) {
        console.error('答案检查服务错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// ==================== 教师侧AI功能 ====================

/**
 * 智能备课生成
 * POST /api/ai/teacher/generate-lesson-plan
 */
router.post('/teacher/generate-lesson-plan', async (req, res) => {
    try {
        const { courseOutline, subject, teacherId, title } = req.body;
        
        if (!courseOutline || !teacherId) {
            return res.status(400).json({
                success: false,
                error: '课程大纲和教师ID不能为空'
            });
        }

        const startTime = Date.now();
        
        // 调用AI服务生成备课内容
        const aiResponse = await difyService.generateLessonPlan(courseOutline, teacherId, subject);
        
        const responseTime = Date.now() - startTime;
        
        if (aiResponse.success) {
            // 保存为课件资源
            const courseResource = new CourseResource({
                teacherId: teacherId,
                title: title || `${subject || '课程'} - AI生成备课方案`,
                subject: subject || '通用',
                resourceType: '教案',
                content: aiResponse.data.answer,
                isAIGenerated: true,
                aiPrompt: courseOutline,
                status: '草稿'
            });
            
            await courseResource.save();
            
            // 记录使用统计
            await UsageStats.recordUsage(
                teacherId, 
                'teacher', 
                'lesson_planning',
                Math.round(responseTime / 1000),
                {
                    aiInteractions: 1,
                    successfulOperations: 1,
                    responseTime: responseTime
                }
            );
            
            res.json({
                success: true,
                data: {
                    lessonPlan: aiResponse.data.answer,
                    resourceId: courseResource._id,
                    conversationId: aiResponse.data.conversationId
                }
            });
        } else {
            await UsageStats.recordUsage(
                teacherId, 
                'teacher', 
                'lesson_planning',
                0,
                { failedOperations: 1, responseTime: responseTime }
            );
            
            res.status(500).json({
                success: false,
                error: aiResponse.error || 'AI服务暂时不可用'
            });
        }
        
    } catch (error) {
        console.error('备课生成服务错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 生成考核内容
 * POST /api/ai/teacher/generate-exam
 */
router.post('/teacher/generate-exam', async (req, res) => {
    try {
        const { teachingContent, examType, subject, teacherId, title } = req.body;
        
        if (!teachingContent || !teacherId) {
            return res.status(400).json({
                success: false,
                error: '教学内容和教师ID不能为空'
            });
        }

        const startTime = Date.now();
        
        // 调用AI服务生成考核内容
        const aiResponse = await difyService.generateExam(teachingContent, teacherId, examType);
        
        const responseTime = Date.now() - startTime;
        
        if (aiResponse.success) {
            // 保存为课件资源
            const courseResource = new CourseResource({
                teacherId: teacherId,
                title: title || `${subject || '课程'} - AI生成考核题目`,
                subject: subject || '通用',
                resourceType: '考核',
                content: aiResponse.data.answer,
                isAIGenerated: true,
                aiPrompt: teachingContent,
                status: '草稿'
            });
            
            await courseResource.save();
            
            // 记录使用统计
            await UsageStats.recordUsage(
                teacherId, 
                'teacher', 
                'exam_generation',
                Math.round(responseTime / 1000),
                {
                    aiInteractions: 1,
                    successfulOperations: 1,
                    responseTime: responseTime
                }
            );
            
            res.json({
                success: true,
                data: {
                    examContent: aiResponse.data.answer,
                    resourceId: courseResource._id,
                    conversationId: aiResponse.data.conversationId
                }
            });
        } else {
            await UsageStats.recordUsage(
                teacherId, 
                'teacher', 
                'exam_generation',
                0,
                { failedOperations: 1, responseTime: responseTime }
            );
            
            res.status(500).json({
                success: false,
                error: aiResponse.error || 'AI服务暂时不可用'
            });
        }
        
    } catch (error) {
        console.error('考核生成服务错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 分析学生表现
 * POST /api/ai/teacher/analyze-performance
 */
router.post('/teacher/analyze-performance', async (req, res) => {
    try {
        const { studentData, teacherId } = req.body;

        if (!studentData || !teacherId) {
            return res.status(400).json({
                success: false,
                error: '学生数据和教师ID不能为空'
            });
        }

        const startTime = Date.now();

        // 调用AI服务分析学生表现
        const aiResponse = await difyService.analyzeStudentPerformance(studentData, teacherId);

        const responseTime = Date.now() - startTime;

        if (aiResponse.success) {
            // 记录使用统计
            await UsageStats.recordUsage(
                teacherId,
                'teacher',
                'student_analytics',
                Math.round(responseTime / 1000),
                {
                    aiInteractions: 1,
                    successfulOperations: 1,
                    responseTime: responseTime
                }
            );

            res.json({
                success: true,
                data: {
                    analysis: aiResponse.data.answer,
                    conversationId: aiResponse.data.conversationId
                }
            });
        } else {
            await UsageStats.recordUsage(
                teacherId,
                'teacher',
                'student_analytics',
                0,
                { failedOperations: 1, responseTime: responseTime }
            );

            res.status(500).json({
                success: false,
                error: aiResponse.error || 'AI服务暂时不可用'
            });
        }

    } catch (error) {
        console.error('学情分析服务错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// ==================== 教师资源管理功能 ====================

/**
 * 获取教师资源列表
 * GET /api/ai/teacher/resources
 */
router.get('/teacher/resources', async (req, res) => {
    try {
        const { teacherId, resourceType, subject, page = 1, limit = 10 } = req.query;

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                error: '教师ID不能为空'
            });
        }

        const query = { teacherId };
        if (resourceType) query.resourceType = resourceType;
        if (subject) query.subject = subject;

        const skip = (page - 1) * limit;

        const resources = await CourseResource.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await CourseResource.countDocuments(query);

        res.json({
            success: true,
            data: {
                resources,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取教师资源失败:', error);
        res.status(500).json({
            success: false,
            error: '获取教师资源失败'
        });
    }
});

// ==================== 学习记录相关功能 ====================

/**
 * 获取学生学习历史
 * GET /api/ai/student/learning-history
 */
router.get('/student/learning-history', async (req, res) => {
    try {
        const { studentId, subject, questionType, limit = 20, page = 1 } = req.query;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: '学生ID不能为空'
            });
        }

        const query = { studentId };
        if (subject) query.subject = subject;
        if (questionType) query.questionType = questionType;

        const skip = (page - 1) * limit;

        const records = await LearningRecord.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await LearningRecord.countDocuments(query);

        res.json({
            success: true,
            data: {
                records,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取学习历史失败:', error);
        res.status(500).json({
            success: false,
            error: '获取学习历史失败'
        });
    }
});

/**
 * AI健康检查
 * GET /api/ai/health
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await difyService.healthCheck();
        res.json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// ==================== 管理员统计功能 ====================

/**
 * 获取系统使用统计
 * GET /api/ai/admin/usage-stats
 */
router.get('/admin/usage-stats', async (req, res) => {
    try {
        const { timeRange = 30 } = req.query;

        // 获取用户活跃度统计
        const userActivity = await UsageStats.getUserActivityStats(timeRange);

        // 获取功能使用排行
        const featureUsage = await UsageStats.getFeatureUsageRanking(null, timeRange);

        // 获取AI功能使用统计
        const aiUsage = await UsageStats.getAIUsageStats(timeRange);

        // 获取使用趋势
        const trends = await UsageStats.getUsageTrend(null, null, 7);

        // 计算概览数据
        const totalUsers = await UsageStats.aggregate([
            {
                $match: {
                    date: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalUsage: { $sum: '$usageCount' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalUsage: { $sum: '$totalUsage' }
                }
            }
        ]);

        const overview = {
            totalUsers: totalUsers[0]?.totalUsers || 0,
            activeUsers: userActivity.reduce((sum, item) => sum + item.activeUsers, 0),
            totalSessions: totalUsers[0]?.totalUsage || 0,
            avgSessionTime: 25.6, // 可以从实际数据计算
            aiInteractions: aiUsage.reduce((sum, item) => sum + item.totalAIInteractions, 0),
            successRate: 0.94 // 可以从实际数据计算
        };

        res.json({
            success: true,
            data: {
                overview,
                userActivity,
                featureUsage,
                aiUsage,
                trends
            }
        });

    } catch (error) {
        console.error('获取使用统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取使用统计失败'
        });
    }
});

/**
 * 获取所有资源概览
 * GET /api/ai/admin/resources-overview
 */
router.get('/admin/resources-overview', async (req, res) => {
    try {
        const { resourceType, subject, search, page = 1, limit = 10 } = req.query;

        const query = {};
        if (resourceType) query.resourceType = resourceType;
        if (subject) query.subject = subject;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const resources = await CourseResource.find(query)
            .populate('teacherId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await CourseResource.countDocuments(query);

        res.json({
            success: true,
            data: {
                resources,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取资源概览失败:', error);
        res.status(500).json({
            success: false,
            error: '获取资源概览失败'
        });
    }
});

module.exports = router;
