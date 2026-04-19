/**
 * 即梦AI控制器
 * 处理文生图和文生视频的请求
 */

const axios = require('axios');
const jimengService = require('../services/jimengService');
const JimengGeneration = require('../models/JimengGeneration');
const jimengConfig = require('../config/jimengConfig');

/**
 * 保存生成记录
 */
const saveGenerationRecord = async (userId, userType, type, taskId, prompt, params) => {
    try {
        // 只有当 userId 是有效的 ObjectId 时才保存记录
        const mongoose = require('mongoose');
        if (!userId || userId === 'anonymous' || !mongoose.Types.ObjectId.isValid(userId)) {
            console.log('[DEBUG] userId无效，跳过保存记录:', userId);
            return null;
        }

        const record = new JimengGeneration({
            userId,
            userType,
            type,
            taskId,
            prompt,
            params,
            status: 'pending',
        });
        await record.save();
        console.log('[DEBUG] 生成记录已保存:', record._id);
        return record;
    } catch (error) {
        console.error('[DEBUG] 保存生成记录失败:', error.message);
        return null;
    }
};

/**
 * 文生图 - 提交任务
 * POST /api/jimeng/text-to-image
 */
const generateImage = async (req, res) => {
    console.log('\n========== 文生图请求到达 ==========');
    console.log('请求body:', JSON.stringify(req.body, null, 2));

    try {
        const { prompt, options = {}, userId, userType } = req.body;

        console.log('[DEBUG] isConfigured():', jimengService.isConfigured());

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '请输入描述文本',
            });
        }

        // 优先使用请求中的 userId，否则尝试从 req.user 获取
        const finalUserId = userId || req.user?._id;
        const finalUserType = userType || req.user?.role || 'Teacher';

        console.log('[DEBUG] finalUserId:', finalUserId);
        console.log('[DEBUG] finalUserType:', finalUserType);

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
            await saveGenerationRecord(
                finalUserId,
                finalUserType,
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

        console.log('[DEBUG] 开始调用 jimengService.textToImage...');
        const result = await jimengService.textToImage(prompt, options);
        console.log('[DEBUG] textToImage 返回:', result);

        if (result.success && result.taskId) {
            await saveGenerationRecord(
                finalUserId,
                finalUserType,
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
        console.error('文生图错误:', error.message);
        console.error('错误详情:', error);
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
    console.log('\n========== 文生视频请求到达 ==========');
    console.log('请求body:', JSON.stringify(req.body, null, 2));

    try {
        const { prompt, options = {}, userId, userType } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '请输入描述文本',
            });
        }

        // 优先使用请求中的 userId，否则尝试从 req.user 获取
        const finalUserId = userId || req.user?._id;
        const finalUserType = userType || req.user?.role || 'Teacher';

        console.log('[DEBUG] finalUserId:', finalUserId);
        console.log('[DEBUG] finalUserType:', finalUserType);

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
            await saveGenerationRecord(
                finalUserId,
                finalUserType,
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

        console.log('[DEBUG] 开始调用 jimengService.textToVideo...');
        const result = await jimengService.textToVideo(prompt, options);
        console.log('[DEBUG] textToVideo 返回:', result);

        if (result.success && result.taskId) {
            await saveGenerationRecord(
                finalUserId,
                finalUserType,
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
        console.error('文生视频错误:', error.message);
        console.error('错误详情:', error);
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
                status: mockResult.status === 'done' ? 'completed' : mockResult.status,
                progress: mockResult.status === 'done' ? 1 : mockResult.status === 'generating' ? 0.5 : 0,
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
            status: result.status === 'done' ? 'completed' : result.status,
            progress: result.status === 'done' ? 1 : result.status === 'generating' ? 0.5 : 0,
            resultUrl: result.imageUrls?.[0] || result.videoUrls?.[0],
            videoUrls: result.videoUrls || [],
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
 * 代理获取媒体资源（解决跨域问题）
 * GET /api/jimeng/proxy
 */
const proxyMedia = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: '缺少URL参数',
            });
        }

        console.log('[DEBUG] 代理请求媒体:', url);

        // ✅ 透传 Range（关键！）
        const headers = {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'http://localhost:3000/',
        };

        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }

        // ✅ 使用 stream（不要 arraybuffer）
        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream',
            timeout: 60000,
            headers,
        });

        // ✅ 设置响应状态（200 / 206）
        res.status(response.status);

        // ✅ 透传关键头（非常重要）
        const passHeaders = [
            'content-type',
            'content-length',
            'accept-ranges',
            'content-range',
        ];

        passHeaders.forEach((key) => {
            const value = response.headers[key];
            if (value) {
                res.setHeader(key, value);
            }
        });

        // ✅ 解决跨域
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

        // ✅ 可选缓存
        res.setHeader('Cache-Control', 'public, max-age=86400');

        // ✅ 流式返回（核心）
        response.data.pipe(res);

    } catch (error) {
        console.error('代理媒体失败:', error.message);

        res.status(500).json({
            success: false,
            message: '获取媒体失败: ' + error.message,
        });
    }
};
// const proxyMedia = async (req, res) => {
//     try {
//         const { url } = req.query;

//         if (!url) {
//             return res.status(400).json({
//                 success: false,
//                 message: '缺少URL参数',
//             });
//         }

//         console.log('[DEBUG] 代理请求媒体:', url);

//         // 设置超时
//         const axios = require('axios');
//         const response = await axios.get(url, {
//             responseType: 'arraybuffer',
//             timeout: 60000,
//             headers: {
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//                 'Referer': 'http://localhost:3000/',
//             },
//         });

//         // 获取内容类型
//         const contentType = response.headers['content-type'] || 'application/octet-stream';

//         // 设置响应头
//         res.setHeader('Content-Type', contentType);
//         res.setHeader('Access-Control-Allow-Origin', '*');
//         res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//         res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//         res.setHeader('Cache-Control', 'public, max-age=86400');

//         // 发送数据
//         res.send(response.data);
//     } catch (error) {
//         console.error('代理媒体失败:', error.message);
//         res.status(500).json({
//             success: false,
//             message: '获取媒体失败: ' + error.message,
//         });
//     }
// };

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
    proxyMedia,
};
