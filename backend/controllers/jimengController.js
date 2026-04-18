/**
 * 即梦AI控制器
 * 处理文生图和文生视频的请求
 */

const jimengService = require('../services/jimengService');
const JimengGeneration = require('../models/JimengGeneration');

/**
 * 文生图 - 提交任务
 * POST /api/jimeng/text-to-image
 */
const generateImage = async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '请输入描述文本',
            });
        }

        const userId = req.body.userId || req.user?._id;
        const userType = req.body.userType || req.user?.role || 'Teacher';

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '用户未认证',
            });
        }

        const serviceInfo = jimengService.getServiceInfo();
        if (!serviceInfo.imageEnabled) {
            return res.status(400).json({
                success: false,
                message: '文生图功能未启用',
            });
        }

        // 如果未配置API，使用模拟模式
        if (!jimengService.isConfigured()) {
            const mockResponse = jimengService.getMockResponse('image');
            await jimengService.saveGenerationRecord(
                userId,
                userType,
                'image',
                mockResponse.data.task_id,
                prompt,
                options
            );

            return res.json({
                success: true,
                taskId: mockResponse.data.task_id,
                status: 'pending',
                message: '文生图任务已提交(模拟模式)',
                mock: true,
            });
        }

        const result = await jimengService.textToImage(prompt, options);

        if (result.success && result.taskId) {
            await jimengService.saveGenerationRecord(
                userId,
                userType,
                'image',
                result.taskId,
                prompt,
                options
            );
        }

        res.json({
            success: true,
            taskId: result.taskId,
            status: result.status,
            message: result.message,
        });
    } catch (error) {
        console.error('文生图错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '图片生成失败',
        });
    }
};

/**
 * 文生视频 - 提交任务
 * POST /api/jimeng/text-to-video
 */
const generateVideo = async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '请输入描述文本',
            });
        }

        const userId = req.body.userId || req.user?._id;
        const userType = req.body.userType || req.user?.role || 'Teacher';

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '用户未认证',
            });
        }

        const serviceInfo = jimengService.getServiceInfo();
        if (!serviceInfo.videoEnabled) {
            return res.status(400).json({
                success: false,
                message: '文生视频功能未启用',
            });
        }

        // 如果未配置API，使用模拟模式
        if (!jimengService.isConfigured()) {
            const mockResponse = jimengService.getMockResponse('video');
            await jimengService.saveGenerationRecord(
                userId,
                userType,
                'video',
                mockResponse.data.task_id,
                prompt,
                options
            );

            return res.json({
                success: true,
                taskId: mockResponse.data.task_id,
                status: 'pending',
                message: '文生视频任务已提交(模拟模式)',
                mock: true,
            });
        }

        const result = await jimengService.textToVideo(prompt, options);

        if (result.success && result.taskId) {
            await jimengService.saveGenerationRecord(
                userId,
                userType,
                'video',
                result.taskId,
                prompt,
                options
            );
        }

        res.json({
            success: true,
            taskId: result.taskId,
            status: result.status,
            message: result.message,
        });
    } catch (error) {
        console.error('文生视频错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '视频生成失败',
        });
    }
};

/**
 * 查询任务状态
 * GET /api/jimeng/task/:taskId
 */
const getTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { type = 'image' } = req.query;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: '缺少任务ID',
            });
        }

        // 先从数据库查找记录
        const record = await JimengGeneration.findOne({ taskId }).lean();

        // 如果任务已完成且有结果，直接返回
        if (record && record.status === 'completed') {
            return res.json({
                success: true,
                taskId,
                status: 'completed',
                resultUrl: record.resultUrl,
                videoUrls: record.videoUrls,
                createdAt: record.createdAt,
                completedAt: record.completedAt,
            });
        }

        // 如果是模拟ID，返回模拟结果
        if (taskId.startsWith('mock_')) {
            const mockResult = jimengService.getMockTaskResult(taskId, type);

            if (mockResult.status === 'done') {
                await jimengService.updateGenerationStatus(
                    taskId,
                    'completed',
                    mockResult.imageUrls?.[0] || mockResult.videoUrls?.[0],
                    mockResult.videoUrls || []
                );
            }

            return res.json({
                success: true,
                taskId,
                status: mockResult.status,
                progress: mockResult.status === 'generating' ? 0.5 : mockResult.status === 'done' ? 1 : 0,
                resultUrl: mockResult.imageUrls?.[0],
                videoUrls: mockResult.videoUrls,
            });
        }

        // 查询即梦API获取最新状态
        if (!jimengService.isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'API未配置',
            });
        }

        const result = type === 'image'
            ? await jimengService.getImageTaskResult(taskId)
            : await jimengService.getVideoTaskResult(taskId);

        if (result.status === 'done') {
            await jimengService.updateGenerationStatus(
                taskId,
                'completed',
                result.imageUrls?.[0] || result.videoUrls?.[0],
                result.videoUrls || []
            );
        }

        res.json({
            success: true,
            taskId,
            status: result.status,
            progress: result.status === 'generating' ? 0.5 : result.status === 'done' ? 1 : 0,
            resultUrl: result.imageUrls?.[0],
            videoUrls: result.videoUrls,
            message: result.message,
        });
    } catch (error) {
        console.error('查询任务状态错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '查询失败',
        });
    }
};

/**
 * 获取模型列表
 * GET /api/jimeng/models
 */
const getModels = async (req, res) => {
    try {
        const models = jimengService.getModels();
        const serviceInfo = jimengService.getServiceInfo();

        res.json({
            success: true,
            models,
            serviceInfo,
        });
    } catch (error) {
        console.error('获取模型列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取模型列表失败',
        });
    }
};

/**
 * 获取用户历史记录
 * GET /api/jimeng/history/:userId
 */
const getUserHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '缺少用户ID',
            });
        }

        const history = await jimengService.getUserHistory(userId, type, parseInt(limit));

        res.json({
            success: true,
            history,
            total: history.length,
        });
    } catch (error) {
        console.error('获取历史记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取历史记录失败',
        });
    }
};

/**
 * 获取服务状态
 * GET /api/jimeng/status
 */
const getStatus = async (req, res) => {
    try {
        const serviceInfo = jimengService.getServiceInfo();
        const models = jimengService.getModels();

        res.json({
            success: true,
            ...serviceInfo,
            models,
        });
    } catch (error) {
        console.error('获取服务状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取服务状态失败',
        });
    }
};

module.exports = {
    generateImage,
    generateVideo,
    getTaskStatus,
    getModels,
    getUserHistory,
    getStatus,
};
