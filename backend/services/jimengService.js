/**
 * 即梦AI服务
 * 封装即梦AI(文生图、文生视频)的API调用
 * API文档: https://www.volcengine.com/docs/85621/1616429
 */

const axios = require('axios');
const crypto = require('crypto');
const jimengConfig = require('../config/jimengConfig');
const JimengGeneration = require('../models/JimengGeneration');

// 缓存解码后的Secret Key
let decodedSecretKey = null;

/**
 * 获取解码后的Secret Key
 * 如果Secret Key是Base64编码的，则解码后返回
 */
function getDecodedSecretKey() {
    if (decodedSecretKey !== null) {
        return decodedSecretKey;
    }

    const secretKey = jimengConfig.SECRET_KEY;
    if (!secretKey) {
        return secretKey;
    }

    // 检查是否是Base64编码 (简单检查：包含=或只包含Base64字符)
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(secretKey) && secretKey.length % 4 === 0;

    if (isBase64) {
        try {
            const decoded = Buffer.from(secretKey, 'base64').toString('utf8');
            // 验证解码后的内容不是空或乱码
            if (decoded && decoded.length > 0) {
                console.log('\n========== Secret Key解码 ==========');
                console.log('原始Secret Key (Base64):', secretKey);
                console.log('解码后Secret Key:', decoded);
                console.log('===================================\n');
                decodedSecretKey = decoded;
                return decodedSecretKey;
            }
        } catch (e) {
            console.log('Secret Key Base64解码失败，使用原始值:', e.message);
        }
    }

    decodedSecretKey = secretKey;
    return decodedSecretKey;
}

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
     * 参考: https://www.volcengine.com/docs/6369/67268
     */
    generateSignature(method, path, queryStr, timestamp, body, signedHeaders) {
        console.log('\n========== 签名计算开始 ==========');
        console.log('1. 输入参数:');
        console.log('   method:', method);
        console.log('   path:', path);
        console.log('   queryStr:', queryStr);
        console.log('   timestamp:', timestamp);
        console.log('   signedHeaders:', signedHeaders);
        console.log('   body:', body);

        // 1. 计算 content-sha256 (body hash)
        const contentSha256 = crypto.createHash('sha256').update(body || '').digest('hex');
        console.log('\n2. Content-SHA256:', contentSha256);

        // 2. 构建 canonical request
        // method + "\n" + path + "\n" + queryStr + "\n" + signedHeaders + "\n" + contentSha256
        const canonicalRequest = [
            method.toUpperCase(),
            path,
            queryStr,
            signedHeaders,
            contentSha256
        ].join('\n');
        console.log('\n3. Canonical Request:\n', canonicalRequest);

        // 3. 计算 canonical request hash
        const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
        console.log('\n4. Canonical Request Hash:', canonicalRequestHash);

        // 4. 构建 string to sign
        const algorithm = 'HMAC-SHA256';
        const credentialScope = this.getCredentialScope(timestamp);
        console.log('\n5. Algorithm:', algorithm);
        console.log('   CredentialScope:', credentialScope);

        const stringToSign = [
            algorithm,
            timestamp,
            credentialScope,
            canonicalRequestHash
        ].join('\n');
        console.log('\n6. String to Sign:\n', stringToSign);

        // 5. 计算签名 (使用解码后的Secret Key)
        const decodedSecret = getDecodedSecretKey();
        console.log('\n7. SECRET_KEY (解码后用于签名):', decodedSecret);
        const signature = crypto.createHmac('sha256', decodedSecret)
            .update(stringToSign)
            .digest('hex');
        console.log('\n8. 最终签名:', signature);
        console.log('========== 签名计算结束 ==========\n');

        return {
            algorithm,
            credentialScope,
            signature,
            contentSha256,
        };
    }

    /**
     * 获取凭证范围
     */
    getCredentialScope(timestamp) {
        // 日期格式: YYYYMMDD
        const date = timestamp.slice(0, 8);
        // 即梦AI 4.0: Region为cn-north-1，Service为cv
        const region = 'cn-north-1';
        const service = 'cv';
        return `${date}/${region}/${service}/request`;
    }

    /**
     * 获取认证头 - 即梦AI 4.0 签名认证
     */
    getAuthHeaders(method, path, queryParams, body) {
        console.log('\n========== 获取认证头开始 ==========');
        console.log('ACCESS_KEY:', jimengConfig.ACCESS_KEY);

        // Volcengine API 需要 UTC 时间戳格式: YYYYMMDD'T'HHMMSS'Z'
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        console.log('生成的 timestamp:', timestamp);

        // 构建 query string
        const queryStr = Object.entries(queryParams)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
        console.log('Query String:', queryStr);

        // 计算 body 的 SHA256 (必须)
        const contentSha256 = crypto.createHash('sha256').update(body || '').digest('hex');
        console.log('Content-SHA256:', contentSha256);

        // 使用 HMAC-SHA256 签名
        const algorithm = 'HMAC-SHA256';
        const credentialScope = this.getCredentialScope(timestamp);
        console.log('CredentialScope:', credentialScope);

        // SignedHeaders 必须包含: content-type;host;x-content-sha256;x-date
        const signedHeaders = 'content-type;host;x-content-sha256;x-date';

        // 构建 canonical request
        const canonicalRequest = [
            method.toUpperCase(),
            path,
            queryStr,
            signedHeaders,
            contentSha256
        ].join('\n');

        console.log('\nCanonical Request:\n', canonicalRequest);

        // 计算 canonical request hash
        const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

        // 构建 string to sign
        const stringToSign = [
            algorithm,
            timestamp,
            credentialScope,
            canonicalRequestHash
        ].join('\n');

        console.log('\nString to Sign:\n', stringToSign);

        // 使用解码后的 Secret Key 计算签名
        const decodedSecret = getDecodedSecretKey();
        console.log('\n使用 Secret Key 签名:', decodedSecret);

        const signature = crypto.createHmac('sha256', decodedSecret)
            .update(stringToSign)
            .digest('hex');

        console.log('最终签名:', signature);

        // 构建 Authorization 头
        const authHeader = `${algorithm} Credential=${jimengConfig.ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
        console.log('\n最终 Authorization:', authHeader);

        console.log('========== 获取认证头结束 ==========\n');

        return {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'X-Date': timestamp,
            'X-Content-SHA256': contentSha256,
            'Host': 'visual.volcengineapi.com',
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

        console.log('=== 即梦API调试信息 ===');
        console.log('URL:', `${jimengConfig.API_URL}/?Action=${action}&Version=${version}`);
        console.log('ACCESS_KEY:', jimengConfig.ACCESS_KEY);
        console.log('Authorization:', headers.Authorization ? '[已设置]' : '[未设置]');
        console.log('X-Date:', headers['X-Date']);
        console.log('X-Content-SHA256:', headers['X-Content-SHA256']);
        console.log('Host:', headers['Host']);
        console.log('========================');

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
     * 即梦4.0 API
     * https://www.volcengine.com/docs/85621/1616429
     */
    async textToImage(prompt, options = {}) {
        if (!jimengConfig.isImageEnabled()) {
            throw new Error('文生图功能未启用或未配置');
        }

        const params = {
            req_key: 'jimeng_t2i_v40',  // 即梦4.0模型
            prompt: prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            scale: options.scale || 0.7,  // 文本影响程度 (0-1)
            seed: options.seed ?? -1,  // -1 表示随机种子
            logo_info: { add_logo: false },  // 默认不添加水印
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
     * 即梦4.0 API
     */
    async getImageTaskResult(taskId) {
        const params = {
            req_key: 'jimeng_t2i_v40',
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
     * 即梦视频3.0 API (720P/1080P)
     * https://www.volcengine.com/docs/85621/1616429
     */
    async textToVideo(prompt, options = {}) {
        if (!jimengConfig.isVideoEnabled()) {
            throw new Error('文生视频功能未启用或未配置');
        }

        // 根据分辨率选择req_key
        const resolution = options.resolution || '720p';
        const reqKey = resolution === '1080p' ? 'jimeng_t2v_v30_1080p' : 'jimeng_t2v_v30';

        // 帧数计算：frames = 24 * 秒数 + 1，支持5秒(121)和10秒(241)
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
                { id: 'jimeng_t2i_v40', name: '即梦文生图4.0', description: '最新文生图模型4.0版本' },
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
