/**
 * 即梦AI服务
 * 封装即梦AI(文生图、文生视频)的API调用
 * API文档: https://www.volcengine.com/docs/85621/1388182
 * 使用 @volcengine/openapi 的 Signer 进行签名
 */

const axios = require('axios');
const { Signer } = require('@volcengine/openapi');
const jimengConfig = require('../config/jimengConfig');
const JimengGeneration = require('../models/JimengGeneration');

// 不可恢复的HTTP状态码，遇到这些错误应立即停止重试
const UNRECOVERABLE_STATUS_CODES = [401, 403, 402, 405];
const UNRECOVERABLE_API_CODES = [50400]; // Access Denied 等权限错误
// 最大API调用失败次数（针对可恢复错误的重试上限）
const MAX_API_FAILURES = 3;

// 单例模式
let jimengServiceInstance = null;

class JimengService {
    constructor() {
        if (jimengServiceInstance) {
            return jimengServiceInstance;
        }
        jimengServiceInstance = this;
    }

    getServiceInfo() {
        return jimengConfig.getServiceInfo();
    }

    isConfigured() {
        return !!(jimengConfig.ACCESS_KEY && jimengConfig.SECRET_KEY);
    }

    /**
     * 使用SDK签名发送请求
     */
    async callVisualAPI(action, version, bodyParams) {
        const url = `${jimengConfig.API_URL}/`;
        const body = JSON.stringify(bodyParams);

        console.log('[DEBUG] 即梦API配置检查:');
        console.log('[DEBUG] ACCESS_KEY:', jimengConfig.ACCESS_KEY ? jimengConfig.ACCESS_KEY.substring(0, 4) + '...' : 'undefined');
        console.log('[DEBUG] SECRET_KEY:', jimengConfig.SECRET_KEY ? jimengConfig.SECRET_KEY.substring(0, 4) + '...' : 'undefined');
        console.log('[DEBUG] API_URL:', jimengConfig.API_URL);

        // 构建请求对象
        const request = {
            method: 'POST',
            params: {
                Action: action,
                Version: version,
            },
            headers: {
                'Content-Type': 'application/json',
                'Host': 'visual.volcengineapi.com',
            },
            body: body,
            pathname: '/',
            region: 'cn-north-1',
        };

        // 创建签名器
        const signer = new Signer(request, 'cv');

        // 添加签名
        signer.addAuthorization({
            accessKeyId: jimengConfig.ACCESS_KEY,
            secretKey: jimengConfig.SECRET_KEY,
        });

        console.log('\n========== 即梦API请求 ==========');
        console.log('URL:', url);
        console.log('Headers:', JSON.stringify(request.headers, null, 2));
        console.log('=================================\n');

        try {
            const response = await axios.post(url, body, {
                headers: request.headers,
                params: request.params,
                timeout: 30000,
            });
            return response.data;
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                // 不可恢复错误（认证/权限），立即终止不重试
                if (UNRECOVERABLE_STATUS_CODES.includes(status)) {
                    const authError = new Error(`API错误: ${status} - ${JSON.stringify(data)}`);
                    authError.isUnrecoverable = true;
                    authError.statusCode = status;
                    throw authError;
                }
                // API业务层权限错误（如 Access Denied 50400）
                if (data?.status && UNRECOVERABLE_API_CODES.includes(data.status)) {
                    const authError = new Error(`API错误: ${status} - ${JSON.stringify(data)}`);
                    authError.isUnrecoverable = true;
                    authError.statusCode = status;
                    throw authError;
                }
                throw new Error(`API错误: ${status} - ${JSON.stringify(data)}`);
            }
            throw error;
        }
    }

    /**
     * 文生图 - 提交任务
     * 即梦3.0 API
     */
    async textToImage(prompt, options = {}) {
        if (!jimengConfig.isImageEnabled()) {
            throw new Error('文生图功能未启用或未配置');
        }

        // 文生图3.0参数
        const params = {
            req_key: 'high_aes_general_v30l_zt2i',
            // req_key: 'jimeng_t2i_v30',
            prompt: prompt,
            use_pre_llm: options.use_pre_llm !== false,
            seed: options.seed ?? -1,
            width: options.width || 1328,
            height: options.height || 1328,
        };

        try {
            const response = await this.callVisualAPI(
                'CVSync2AsyncSubmitTask',
                '2022-08-31',
                params
            );

            if (response.code === 10000) {
                return {
                    success: true,
                    taskId: response.data.task_id,
                    status: 'pending',
                    message: '文生图任务已提交',
                };
            } else {
                throw new Error(response.message || '提交失败');
            }
        } catch (error) {
            console.error('即梦文生图API错误:', error.message);
            throw new Error(`文生图失败: ${error.message}`);
        }
    }

    /**
     * 文生图 - 查询任务状态
     * 即梦3.0 API
     */
    async getImageTaskResult(taskId) {
        const params = {
            req_key: 'high_aes_general_v30l_zt2i',
            task_id: taskId,
            req_json: JSON.stringify({
                return_url: true,
            }),
        };

        try {
            const response = await this.callVisualAPI(
                'CVSync2AsyncGetResult',
                '2022-08-31',
                params
            );

            // 检查API返回状态
            if (response.code !== 10000) {
                throw new Error(response.message || `API错误: ${response.code}`);
            }

            // API返回 image_url (下划线)
            const imageUrl = response.data?.image_url || response.data?.image_urls?.[0] || null;

            console.log('\n========== 文生图查询结果 ==========');
            console.log('image_url:', imageUrl);
            console.log('status:', response.data?.status);
            console.log('===================================\n');

            return {
                code: response.code,
                status: response.data?.status,
                imageUrls: imageUrl ? [imageUrl] : [],
                message: response.message,
            };
        } catch (error) {
            console.error('查询文生图任务错误:', error.message);
            throw error;
        }
    }

    /**
     * 文生视频 - 提交任务
     * 即梦视频3.0 API
     */
    async textToVideo(prompt, options = {}) {
        if (!jimengConfig.isVideoEnabled()) {
            throw new Error('文生视频功能未启用或未配置');
        }

        const resolution = options.resolution || '720p';
        const reqKey = resolution === '1080p' ? 'jimeng_t2v_v30_1080p' : 'jimeng_t2v_v30';

        const duration = options.duration || 5;
        const frames = duration === 10 ? 241 : 121;

        const params = {
            req_key: reqKey,
            prompt: prompt,
            seed: options.seed ?? -1,
            frames: frames,
            aspect_ratio: options.aspect_ratio || '16:9',
        };

        try {
            const response = await this.callVisualAPI(
                'CVSync2AsyncSubmitTask',
                '2022-08-31',
                params
            );

            if (response.code === 10000) {
                return {
                    success: true,
                    taskId: response.data.task_id,
                    status: 'pending',
                    message: '文生视频任务已提交',
                };
            } else {
                throw new Error(response.message || '提交失败');
            }
        } catch (error) {
            console.error('即梦文生视频API错误:', error.message);
            throw new Error(`文生视频失败: ${error.message}`);
        }
    }

    /**
     * 文生视频 - 查询任务状态
     * 即梦视频3.0 API
     */
    async getVideoTaskResult(taskId, resolution = '720p') {
        const reqKey = resolution === '1080p' ? 'jimeng_t2v_v30_1080p' : 'jimeng_t2v_v30';
        const params = {
            req_key: reqKey,
            task_id: taskId,
            req_json: JSON.stringify({ return_url: true }),
        };

        try {
            const response = await this.callVisualAPI(
                'CVSync2AsyncGetResult',
                '2022-08-31',
                params
            );

            // 检查API返回状态
            if (response.code !== 10000) {
                throw new Error(response.message || `API错误: ${response.code}`);
            }

            // API返回 video_url (下划线)
            const videoUrl = response.data?.video_url || response.data?.video_urls?.[0] || null;

            console.log('\n========== 文生视频查询结果 ==========');
            console.log('video_url:', videoUrl);
            console.log('status:', response.data?.status);
            console.log('=====================================\n');

            return {
                code: response.code,
                status: response.data?.status,
                videoUrls: videoUrl ? [videoUrl] : [],
                message: response.message,
            };
        } catch (error) {
            console.error('查询文生视频任务错误:', error.message);
            throw error;
        }
    }

    /**
     * 轮询等待任务完成
     */
    async waitForTaskCompletion(taskId, type = 'image') {
        const { maxAttempts, intervalMs, timeoutMs } = jimengConfig.polling;
        const startTime = Date.now();
        let consecutiveFailures = 0;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error('任务超时');
            }

            try {
                const result = type === 'image'
                    ? await this.getImageTaskResult(taskId)
                    : await this.getVideoTaskResult(taskId);

                // 查询成功，重置失败计数
                consecutiveFailures = 0;

                if (result.status === 'done' && result.code === 10000) {
                    return result;
                }

                if (result.status === 'failed' || result.code !== 10000) {
                    throw new Error(result.message || '任务失败');
                }
            } catch (error) {
                // 不可恢复错误（认证/权限），立即终止
                if (error.isUnrecoverable) {
                    console.error('不可恢复错误，停止轮询:', error.message);
                    await this.updateGenerationStatus(taskId, 'failed', null, [], error.message);
                    throw error;
                }

                consecutiveFailures++;
                if (consecutiveFailures >= MAX_API_FAILURES) {
                    console.error(`连续${MAX_API_FAILURES}次API调用失败，停止轮询`);
                    await this.updateGenerationStatus(taskId, 'failed', null, [], `连续查询失败: ${error.message}`);
                    throw new Error(`连续${MAX_API_FAILURES}次查询失败，停止重试: ${error.message}`);
                }

                console.warn(`查询失败(${consecutiveFailures}/${MAX_API_FAILURES}):`, error.message);
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        throw new Error('任务处理超时');
    }

    /**
     * 保存生成记录到数据库
     */
    async saveGenerationRecord(userId, userType, type, taskId, prompt, params) {
        try {
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
            return record;
        } catch (error) {
            console.error('保存生成记录失败:', error);
            return null;
        }
    }

    /**
     * 获取用户的历史生成记录
     */
    async getUserHistory(userId, type = null, limit = 20) {
        const mongoose = require('mongoose');
        const query = {};

        // 处理 userId：如果是有效的 ObjectId 字符串，转换为 ObjectId
        if (userId) {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                query.userId = new mongoose.Types.ObjectId(userId);
            } else {
                query.userId = userId;
            }
        }

        if (type) {
            query.type = type;
        }

        console.log('[DEBUG] getUserHistory query:', JSON.stringify(query));

        return JimengGeneration.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * 更新生成记录状态
     */
    async updateGenerationStatus(taskId, status, resultUrl = null, videoUrls = [], errorMessage = null) {
        const updateData = { status };
        if (resultUrl) updateData.resultUrl = resultUrl;
        if (videoUrls.length > 0) updateData.videoUrls = videoUrls;
        if (errorMessage) updateData.errorMessage = errorMessage;
        if (status === 'completed') updateData.completedAt = new Date();

        return JimengGeneration.findOneAndUpdate({ taskId }, updateData, { new: true });
    }

    /**
     * 获取模型列表
     */
    getModels() {
        return {
            image: [
                { id: 'jimeng_t2i_v30', name: '即梦文生图3.0', description: '文生图3.0版本，支持高清大图' },
            ],
            video: [
                { id: 'jimeng_t2v_v30', name: '即梦视频3.0 (720P)', description: '高清视频生成，推荐性价比之选' },
                { id: 'jimeng_t2v_v30_1080p', name: '即梦视频3.0 (1080P)', description: '全高清视频生成' },
            ],
        };
    }

    /**
     * 获取模拟响应(用于开发测试)
     */
    getMockResponse(type) {
        const taskId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            code: 10000,
            data: { task_id: taskId },
            message: 'Success',
        };
    }

    /**
     * 获取模拟任务结果
     */
    getMockTaskResult(taskId, type) {
        const elapsed = Date.now() - parseInt(taskId.split('_')[1] || Date.now());
        const progress = Math.min(elapsed / 10000, 1);

        if (progress < 0.3) {
            return { status: 'in_queue', code: 10000 };
        } else if (progress < 1) {
            return { status: 'generating', code: 10000 };
        } else {
            if (type === 'image') {
                return {
                    status: 'done',
                    code: 10000,
                    imageUrls: [`https://picsum.photos/1024/1024?random=${taskId}`],
                };
            } else {
                // 真实视频URL（由API返回）
                return {
                    status: 'done',
                    code: 10000,
                    videoUrls: [],
                };
            }
        }
    }
}

// 导出单例
module.exports = new JimengService();
