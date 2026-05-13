const router = require('express').Router();
const {
    generatePracticalExercise,
    getTeacherPracticalExercises,
    getPracticalExerciseById,
    updatePracticalExercise,
    deletePracticalExercise,
    copyPracticalExercise,
    batchDeletePracticalExercises,
    publishPracticalExercise
} = require('../controllers/practical-exercise-controller');
const { streamGeneratePracticalExercise } = require('../controllers/streamingPracticalExercise-controller');

// 中间件
const { aiRateLimit, aiFeatureToggle, aiCacheMiddleware } = require('../middleware/aiMiddleware');

/**
 * 实训练习路由
 */

// 生成实训练习
router.post('/generate/:teacherId',
    aiRateLimit,
    aiFeatureToggle('practicalExercise'),
    generatePracticalExercise
);

// 流式生成实训练习 (SSE)
router.post('/generate/stream/:teacherId',
    aiRateLimit,
    aiFeatureToggle('practicalExercise'),
    streamGeneratePracticalExercise
);

// 获取教师的实训练习列表
router.get('/teacher/:teacherId', 
    getTeacherPracticalExercises
);

// 获取实训练习详情
router.get('/:exerciseId', 
    getPracticalExerciseById
);

// 更新实训练习
router.put('/:exerciseId', 
    updatePracticalExercise
);

// 删除实训练习
router.delete('/:exerciseId',
    deletePracticalExercise
);

// 复制实训练习
router.post('/:exerciseId/copy',
    copyPracticalExercise
);

// 批量删除实训练习
router.post('/batch/delete',
    batchDeletePracticalExercises
);

// 发布实训练习
router.put('/:exerciseId/publish',
    publishPracticalExercise
);

// 导出实训练习为Word文档
router.post('/:exerciseId/export/word', async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const PracticalExercise = require('../models/practicalExerciseSchema');
        
        const exercise = await PracticalExercise.findById(exerciseId)
            .populate('subject', 'subName')
            .populate('teacher', 'name')
            .populate('courseware', 'title');

        if (!exercise) {
            return res.status(404).json({ message: '实训练习不存在' });
        }

        // 使用现有的Word导出功能
        const { generateWordDocument, createSafeFilename } = require('../utils/wordGenerator');
        
        const docBuffer = await generateWordDocument({
            title: exercise.title,
            description: exercise.description,
            subject: exercise.subject.subName,
            teacher: exercise.teacher.name,
            courseware: exercise.courseware?.title || '',
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            exerciseType: exercise.exerciseType,
            targetSkills: exercise.targetSkills,
            questions: exercise.questions.map(q => ({
                questionNumber: q.questionNumber,
                questionType: q.questionType,
                questionText: q.questionText,
                requirements: q.requirements,
                referenceAnswer: q.referenceAnswer,
                codeTemplate: q.codeTemplate,
                gradingCriteria: q.gradingCriteria,
                explanation: q.explanation,
                points: q.points,
                estimatedTime: q.estimatedTime,
                knowledgePoints: q.knowledgePoints,
                environmentRequirements: q.environmentRequirements
            })),
            totalPoints: exercise.totalPoints,
            createdAt: exercise.createdAt
        }, 'practical-exercise');

        // 增加下载次数
        exercise.usageStats.downloadCount += 1;
        await exercise.save();

        // 安全处理文件名，避免中文字符导致的HTTP头部错误
        const { contentDisposition } = createSafeFilename(exercise.title, '实训练习');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', contentDisposition);
        res.send(docBuffer);

    } catch (error) {
        console.error('导出实训练习Word文档错误:', error);
        res.status(500).json({ 
            success: false,
            message: '导出失败', 
            error: error.message 
        });
    }
});

// 批量导出实训练习数据为Word
router.post('/export/word', async (req, res) => {
    try {
        const { exercise } = req.body;

        if (!exercise) {
            return res.status(400).json({ message: '缺少实训练习数据' });
        }

        const { generateWordDocument, createSafeFilename } = require('../utils/wordGenerator');
        
        const docBuffer = await generateWordDocument({
            title: exercise.title,
            description: exercise.description,
            subject: exercise.subject?.subName || '未知学科',
            teacher: exercise.teacher?.name || '未知教师',
            courseware: exercise.courseware?.title || '',
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            exerciseType: exercise.exerciseType,
            targetSkills: exercise.targetSkills,
            questions: exercise.questions || [],
            totalPoints: exercise.totalPoints,
            createdAt: exercise.createdAt || new Date()
        }, 'practical-exercise');

        // 安全处理文件名，避免中文字符导致的HTTP头部错误
        const { contentDisposition } = createSafeFilename(exercise.title, '实训练习');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', contentDisposition);
        res.send(docBuffer);

    } catch (error) {
        console.error('批量导出实训练习Word文档错误:', error);
        res.status(500).json({ 
            success: false,
            message: '导出失败', 
            error: error.message 
        });
    }
});

// 生成实训练习分享链接
router.post('/:exerciseId/share', async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const { expiresIn = '7d' } = req.body;

        const PracticalExercise = require('../models/practicalExerciseSchema');
        const exercise = await PracticalExercise.findById(exerciseId);

        if (!exercise) {
            return res.status(404).json({ message: '实训练习不存在' });
        }

        // 生成分享token
        const crypto = require('crypto');
        const shareToken = crypto.randomBytes(32).toString('hex');
        
        // 这里可以将分享信息存储到Redis或数据库
        // 暂时返回简单的分享链接
        const shareUrl = `${req.protocol}://${req.get('host')}/api/practical-exercise/share/${shareToken}`;

        // 增加分享次数
        exercise.usageStats.shareCount += 1;
        await exercise.save();

        res.json({
            success: true,
            shareUrl,
            expiresIn,
            message: '分享链接生成成功'
        });

    } catch (error) {
        console.error('生成分享链接错误:', error);
        res.status(500).json({ 
            success: false,
            message: '生成分享链接失败', 
            error: error.message 
        });
    }
});

// 通过分享链接获取实训练习
router.get('/share/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        // 这里应该从Redis或数据库中验证token并获取对应的实训练习
        // 暂时返回错误信息
        res.status(404).json({ 
            success: false,
            message: '分享链接无效或已过期' 
        });

    } catch (error) {
        console.error('获取分享实训练习错误:', error);
        res.status(500).json({ 
            success: false,
            message: '获取分享内容失败', 
            error: error.message 
        });
    }
});

// 发布实训练习
router.put('/:exerciseId/publish', async (req, res) => {
    try {
        const { exerciseId } = req.params;
        
        const PracticalExercise = require('../models/practicalExerciseSchema');
        const exercise = await PracticalExercise.findByIdAndUpdate(
            exerciseId,
            { status: '已发布', updatedAt: new Date() },
            { new: true }
        );

        if (!exercise) {
            return res.status(404).json({ message: '实训练习不存在' });
        }

        res.json({
            success: true,
            message: '实训练习发布成功',
            exercise
        });

    } catch (error) {
        console.error('发布实训练习错误:', error);
        res.status(500).json({ 
            success: false,
            message: '发布失败', 
            error: error.message 
        });
    }
});

module.exports = router;
