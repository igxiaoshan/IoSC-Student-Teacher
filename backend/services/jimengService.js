/**
 * 即梦AI服务
 * 封装即梦AI(文生图、文生视频)的API调用
 * API文档: https://www.volcengine.com/docs/85621/1616429
 */

const axios = require('axios');
const jimengConfig = require('../config/jimengConfig');
const JimengGeneration = require('../models/JimengGeneration');

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
     * 生成火山引擎签名
     * https://www.volcengine.com/docs/6369/67268
     */
    generateSignature(method, path, queryStr, timestamp, body) {
        const crypto = require('crypto');

        // 1. 拼接待签名字符串
        // HmacSHA256(method + "\n" + path + "\n" + queryStr + "\n" + timestamp + "\n" + bodyHash + "\n" + signedHeaders, secretKey)
        const bodyHash = crypto.createHash('sha256').update(body || '').digest('hex');

        const signedHeaders = 'content-type';  // 固定值
        const canonicalRequest = [
            method.toUpperCase(),
            path,
            queryStr,
            timestamp,
            bodyHash,
            signedHeaders
        ].join('\n');

        // 2. 计算签名
        const signature = crypto.createHmac('sha256', jimengConfig.SECRET_KEY)
            .update(canonicalRequest)
            .digest('hex');

        return {
            canonicalRequest,
            signature,
            signedHeaders,
        };
    }

    /**
     * 获取认证头
     */
    getAuthHeaders(method, path, queryParams, body) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const queryStr = Object.entries(queryParams)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');

        const { signature, signedHeaders } = this.generateSignature(
            method,
            path,
            queryStr,
            timestamp,
            body
        );

        // 构建 Authorization 头
        const authHeader = `HMAC-SHA256 Access=${jimengConfig.ACCESS_KEY}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        return {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'X-Date': timestamp,
        };
    }

    /**
     * 调用火山引擎视觉API
     */
    async callVisualAPI(action, version, bodyParams) {
        const path = '/';
        const queryParams = {
            Action: action,
            Version: version,
        };

        const body = JSON.stringify(bodyParams);
        const headers = this.getAuthHeaders('POST', path, queryParams, body);
        const url = `${jimengConfig.API_URL}/?Action=${action}&Version=${version}`;

        try {
            const response = await axios.post(url, body, { headers, timeout: 30000 });
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * 文生图 - 提交任务
     * https://www.volcengine.com/docs/85621/1616429
     */
    async textToImage(prompt, options = {}) {
        if (!jimengConfig.isImageEnabled()) {
            throw new Error('文生图功能未启用或未配置');
        }

        const params = {
            req_key: 'jimeng_t2i_v30',  // 固定值
            prompt: prompt,
            use_pre_llm: options.use_pre_llm ?? jimengConfig.imageDefaults.use_pre_llm,
            seed: options.seed ?? jimengConfig.imageDefaults.seed,
            width: options.width || jimengConfig.imageDefaults.width,
            height: options.height || jimengConfig.imageDefaults.height,
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
     */
    async getImageTaskResult(taskId) {
        const params = {
            req_key: 'jimeng_t2i_v30',
            task_id: taskId,
            req_json: JSON.stringify({
                return_url: true,
                logo_info: { add_logo: false }
            }),
        };

        try {
            const response = await this.callVisualAPI(
                'CVSync2AsyncGetResult',
                '2022-08-31',
                params
            );

            return {
                code: response.code,
                status: response.data?.status,
                imageUrls: response.data?.image_urls || [],
                message: response.message,
            };
        } catch (error) {
            console.error('查询文生图任务错误:', error.message);
            throw error;
        }
    }

    /**
     * 文生视频 - 提交任务
     */
    async textToVideo(prompt, options = {}) {
        if (!jimengConfig.isVideoEnabled()) {
            throw new Error('文生视频功能未启用或未配置');
        }

        const params = {
            req_key: 'jimeng_t2v_v30',  // 固定值
            prompt: prompt,
            duration: options.duration || jimengConfig.videoDefaults.duration,
            resolution: options.resolution || jimengConfig.videoDefaults.resolution,
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
     */
    async getVideoTaskResult(taskId) {
        const params = {
            req_key: 'jimeng_t2v_v30',
            task_id: taskId,
            req_json: JSON.stringify({ return_url: true }),
        };

        try {
            const response = await this.callVisualAPI(
                'CVSync2AsyncGetResult',
                '2022-08-31',
                params
            );

            return {
                code: response.code,
                status: response.data?.status,
                videoUrls: response.data?.video_urls || [],
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

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error('任务超时');
            }

            const result = type === 'image'
                ? await this.getImageTaskResult(taskId)
                : await this.getVideoTaskResult(taskId);

            if (result.status === 'done' && result.code === 10000) {
                return result;
            }

            if (result.status === 'failed' || result.code !== 10000) {
                throw new Error(result.message || '任务失败');
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
        const query = { userId };
        if (type) {
            query.type = type;
        }

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
                { id: 'jimeng_t2i_v30', name: '即梦文生图3.0', description: '最新文生图模型' },
            ],
            video: [
                { id: 'jimeng_t2v_v30', name: '即梦文生视频3.0', description: '最新视频生成模型' },
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
                return {
                    status: 'done',
                    code: 10000,
                    videoUrls: ['https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'],
                };
            }
        }
    }
}

// 导出单例
module.exports = new JimengService();
