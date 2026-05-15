/**
 * 知识视频生成控制器
 * 先查询Dify知识库，根据结果决定视频生成内容
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jimengService = require('../services/jimengService');
const difyConfig = require('../config/difyConfig');
const JimengGeneration = require('../models/JimengGeneration');

// 视频存储目录
const VIDEO_STORAGE_DIR = path.join(__dirname, '..', 'videos');

// 确保视频目录存在
if (!fs.existsSync(VIDEO_STORAGE_DIR)) {
    fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true });
}


/**
 * 下载视频到本地
 * @param {string} videoUrl - 视频URL
 * @param {string} taskId - 任务ID
 * @param {string} VIDEO_STORAGE_DIR - 存储目录
 * @returns {Promise<string>} 本地文件路径
 */
const downloadVideoToLocal = async (videoUrl, taskId) => {
    // 检查URL是否即将过期（dy_q参数是Unix时间戳）
    const urlObj = new URL(videoUrl);
    const dyQ = urlObj.searchParams.get('dy_q');
    let expireTime = null;
    if (dyQ) {
        expireTime = parseInt(dyQ) * 1000;
        const now = Date.now();
        // 如果已过期，直接抛出错误
        if (now > expireTime) {
            throw new Error(`视频链接已过期，过期时间: ${new Date(expireTime).toLocaleString()}`);
        }
        // 如果距离过期不足30秒，提醒但继续尝试
        const timeLeft = (expireTime - now) / 1000;
        if (timeLeft < 30) {
            console.log(`[下载] ⚠️ 链接即将过期，剩余 ${timeLeft.toFixed(1)} 秒`);
        } else {
            console.log(`[下载] 链接有效期至: ${new Date(expireTime).toLocaleString()}, 剩余 ${timeLeft.toFixed(1)} 秒`);
        }
    }

    // 生成文件名
    const fileName = `${taskId}_${Date.now()}.mp4`;
    const filePath = path.join(VIDEO_STORAGE_DIR, fileName);

    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // 简化请求头 - 测试发现带Referer反而403，不带反而成功
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };

    // 尝试多种方法下载
    const attempts = [
        // 方法1：标准GET - 简化头
        {
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            headers,
            timeout: 120000,
            maxRedirects: 5,
            decompress: false
        },
        // 方法2：添加更多浏览器特征
        {
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            headers: {
                ...headers,
                'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
            },
            timeout: 120000,
            maxRedirects: 5,
            decompress: false
        },
        // 方法3：使用 https 模块直接下载（更底层的控制）
        {
            method: 'GET_HTTPS',
            url: videoUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
            },
            timeout: 120000
        }
    ];

    let lastError = null;

    for (let i = 0; i < attempts.length; i++) {
        try {
            console.log(`[下载] 尝试方法 ${i + 1}/${attempts.length}...`);

            let response;

            // 方法3使用https模块直接下载
            if (attempts[i].method === 'GET_HTTPS') {
                response = await downloadWithHttps(attempts[i].url, attempts[i].headers, filePath, attempts[i].timeout);
                if (response) {
                    console.log(`[下载] 完成: ${filePath}`);
                    return filePath;
                }
            } else {
                response = await axios(attempts[i]);

                // 检查内容类型
                const contentType = response.headers['content-type'];
                console.log(`[下载] Content-Type: ${contentType}`);

                if (contentType && contentType.includes('text/html')) {
                    throw new Error('返回了HTML页面而非视频，可能被拦截');
                }

                // 保存文件
                const writer = fs.createWriteStream(filePath);

                return new Promise((resolve, reject) => {
                    let downloadedBytes = 0;
                    let startTime = Date.now();

                    response.data.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                    });

                    response.data.pipe(writer);

                    writer.on('finish', () => {
                        const duration = (Date.now() - startTime) / 1000;
                        const sizeMB = (downloadedBytes / 1024 / 1024).toFixed(2);
                        console.log(`[下载] 完成: ${filePath}, 大小: ${sizeMB}MB, 耗时: ${duration}s`);
                        resolve(filePath);
                    });

                    writer.on('error', (err) => {
                        cleanup(filePath);
                        reject(new Error(`文件写入失败: ${err.message}`));
                    });

                    response.data.on('error', (err) => {
                        cleanup(filePath);
                        writer.destroy();
                        reject(new Error(`网络流错误: ${err.message}`));
                    });
                });
            }

        } catch (error) {
            lastError = error;
            console.error(`[下载] 方法 ${i + 1} 失败:`, error.message);

            // 清理文件
            cleanup(filePath);

            // 如果是403，尝试下一个方法
            if (error.response?.status === 403 || error.code === 'ERR_BAD_REQUEST') {
                console.log(`[下载] 403错误，尝试备用方案...`);
                continue;
            }

            // 其他错误直接抛出
            throw error;
        }
    }

    // 所有方法都失败
    throw new Error(`所有下载方法均失败，最后错误: ${lastError?.message}`);
};

/**
 * 使用 https 模块直接下载视频（绕过axios的一些限制）
 */
function downloadWithHttps(url, headers, filePath, timeout) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const http = require('http');
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                ...headers,
                'Accept': '*/*',
            },
            timeout: timeout,
        };

        const req = protocol.request(options, (res) => {
            // 检查状态码
            if (res.statusCode === 403 || res.statusCode === 301 || res.statusCode === 302) {
                console.log(`[下载-HTTPS] 状态码: ${res.statusCode}`);
                // 如果是重定向，跟随重定向
                if (res.statusCode === 302 || res.statusCode === 301) {
                    const location = res.headers.location;
                    if (location) {
                        console.log(`[下载-HTTPS] 重定向到: ${location}`);
                        // 递归处理重定向
                        downloadWithHttps(location, headers, filePath, timeout)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }
                }
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            const contentType = res.headers['content-type'];
            console.log(`[下载-HTTPS] Content-Type: ${contentType}`);

            if (contentType && contentType.includes('text/html')) {
                reject(new Error('返回了HTML页面而非视频'));
                return;
            }

            const writer = fs.createWriteStream(filePath);
            let downloadedBytes = 0;

            res.on('data', (chunk) => {
                downloadedBytes += chunk.length;
            });

            res.pipe(writer);

            writer.on('finish', () => {
                const sizeMB = (downloadedBytes / 1024 / 1024).toFixed(2);
                console.log(`[下载-HTTPS] 完成, 大小: ${sizeMB}MB`);
                resolve(true);
            });

            writer.on('error', (err) => {
                cleanup(filePath);
                reject(err);
            });
        });

        req.on('error', (err) => {
            cleanup(filePath);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            cleanup(filePath);
            reject(new Error('下载超时'));
        });

        req.end();
    });
}

// 清理函数
function cleanup(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[下载] 已清理未完成文件: ${filePath}`);
        }
    } catch (e) {
        // 忽略清理错误
    }
}

// module.exports = { downloadVideoToLocal };

/**
 * 保存知识视频生成记录
 */
const saveKnowledgeVideoRecord = async (userId, userType, taskId, keyword, prompt, knowledgeSource, localFilePath = null) => {
    try {
        const mongoose = require('mongoose');
        if (!userId || userId === 'anonymous' || !mongoose.Types.ObjectId.isValid(userId)) {
            console.log('[DEBUG] userId无效，跳过保存记录:', userId);
            return null;
        }

        const record = new JimengGeneration({
            userId,
            userType,
            type: 'video',
            taskId,
            prompt: keyword,
            params: {
                knowledgeSource,
                videoPrompt: prompt,
            },
            status: 'pending',
            localFilePath, // 本地文件路径
        });
        await record.save();
        console.log('[DEBUG] 知识视频记录已保存:', record._id);
        return record;
    } catch (error) {
        console.error('[DEBUG] 保存知识视频记录失败:', error.message);
        return null;
    }
};

/**
 * 更新知识视频记录状态
 */
const updateKnowledgeVideoRecord = async (taskId, status, localFilePath = null, resultUrl = null) => {
    try {
        const updateData = { status };
        if (localFilePath) updateData.localFilePath = localFilePath;
        // 如果传入了resultUrl（可能是代理URL或CDN URL），则存储它
        if (resultUrl) updateData.resultUrl = resultUrl;
        if (status === 'completed') updateData.completedAt = new Date();

        const record = await JimengGeneration.findOneAndUpdate(
            { taskId },
            updateData,
            { new: true }
        );

        console.log('[DEBUG] 知识视频记录已更新:', record?._id);
        return record;
    } catch (error) {
        console.error('[DEBUG] 更新知识视频记录失败:', error.message);
        return null;
    }
};

/**
 * 查询Dify知识库获取知识内容
 * @returns { content: string | null, success: boolean }
 */
const queryDifyKnowledge = async (keyword, subject) => {
    try {
        const baseURL = difyConfig.baseURL || process.env.DIFY_BASE_URL;
        const apiKey = difyConfig.apiKey || process.env.DIFY_API_KEY;
        const appId = difyConfig.apps?.student?.learningAssistant?.appId || process.env.DIFY_STUDENT_LEARNING_APP_ID;

        if (!baseURL || !apiKey || !appId) {
            console.log('[Dify] 配置不完整，跳过知识库查询');
            return { success: false, content: null };
        }

        console.log('[Dify] 开始查询知识库, 关键词:', keyword);

        const request = {
            inputs: {},
            query: `[角色: 知识讲解专家]
[学科: ${subject || '通用'}]
[知识点: ${keyword}]

请详细介绍"${keyword}"这个知识点。要求：
1. 使用Markdown格式化输出
2. 包含概念定义、核心原理、应用示例三个部分
3. 如果有相关公式或代码，请用代码块展示
4. 内容要准确、简洁、易懂`,
            response_mode: 'blocking',
            user: 'knowledge-video-system',
        };

        const response = await axios.post(
            `${baseURL}/v1/chat-messages`,
            request,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }
        );

        console.log('[Dify] 响应状态:', response.data?.event);

        // blocking模式返回 event: 'message', answer字段直接包含内容
        if (response.data?.event === 'message' && response.data?.answer) {
            const answer = response.data.answer.trim();
            console.log('[Dify] 获取到回答长度:', answer.length);

            // 只要获取到非空回答，就认为知识库查询成功
            if (answer.length > 0) {
                return {
                    success: true,
                    content: answer,
                    conversationId: response.data.conversation_id,
                };
            }
        }

        // 兼容：某些Dify版本直接返回answer
        if (response.data?.answer && typeof response.data.answer === 'string') {
            const answer = response.data.answer.trim();
            if (answer.length > 0) {
                return {
                    success: true,
                    content: answer,
                };
            }
        }

        console.log('[Dify] 知识库返回空内容');
        return { success: true, content: null };

    } catch (error) {
        console.error('[Dify] 查询失败:', error.message);
        return { success: false, content: null };
    }
};

/**
 * 生成知识视频
 * POST /api/knowledge/video-generate
 *
 * 流程：
 * 1. 查询Dify知识库获取知识内容
 * 2. 有内容 -> 用Dify内容生成视频prompt
 * 3. 无内容 -> 用原生词条生成视频prompt
 * 4. 调用即梦API生成视频
 * 5. 轮询获取视频URL
 * 6. 下载视频到本地
 * 7. 保存本地路径到MongoDB
 */
const generateKnowledgeVideo = async (req, res) => {
    try {
        const { keyword, subject, userId, userType } = req.body;

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '请输入知识点关键词',
            });
        }

        console.log('\n========== 知识视频生成请求 ==========');
        console.log('知识点:', keyword);
        console.log('科目:', subject);
        console.log('用户:', userId);

        // Step 1: 查询Dify知识库
        let knowledgeContent = null;
        let knowledgeSource = 'keyword'; // 默认用原生词条

        try {
            const difyResult = await queryDifyKnowledge(keyword, subject);
            if (difyResult.success && difyResult.content) {
                knowledgeContent = difyResult.content;
                knowledgeSource = 'dify';
                console.log('[知识库] 获取到内容，长度:', knowledgeContent.length);
            } else {
                console.log('[知识库] 未获取到内容，使用原生词条');
            }
        } catch (difyError) {
            console.error('[知识库] 查询异常:', difyError.message);
        }

        // Step 2: 生成视频prompt（根据userType添加角色前缀）
        let rolePrompt = '';
        let videoPrompt = '';

        // 根据用户类型设置角色前缀
        if (userType === 'Teacher') {
            rolePrompt = '你是一名资深讲师，你需要教授以下教学内容，请生成一个生动形象的教学视频：';
        } else {
            rolePrompt = '你是一名学生，你需要学习以下知识内容，请生成一个帮助理解的学习视频：';
        }

        if (knowledgeSource === 'dify' && knowledgeContent) {
            // 有知识库内容
            const content = knowledgeContent.substring(0, 400);
            videoPrompt = `${rolePrompt}\n\n【知识点】${keyword}\n【详细内容】${content}`;
            console.log('[视频生成] 使用Dify知识库内容，添加角色前缀');
        } else {
            // 无知识库内容，用原生词条
            videoPrompt = `${rolePrompt}\n\n【知识点】${keyword}，生动形象地讲解这个知识点的概念、原理和应用示例`;
            console.log('[视频生成] 使用原生词条，添加角色前缀');
        }

        console.log('[视频生成] 最终prompt:', videoPrompt.substring(0, 100) + '...');

        // Step 3: 检查视频功能是否启用
        const serviceInfo = jimengService.getServiceInfo();
        if (!serviceInfo.videoEnabled) {
            return res.status(400).json({
                success: false,
                message: '文生视频功能未启用',
            });
        }

 // Step 4: 调用即梦AI生成视频
 const videoResult = await jimengService.textToVideo(videoPrompt, {
 duration: 5,
 resolution: '720p',
 aspect_ratio: '16:9',
 });

 console.log('[视频生成] 提交成功, taskId:', videoResult.taskId);

 // 保存记录（pending状态）
 const record = await saveKnowledgeVideoRecord(userId, userType, videoResult.taskId, keyword, videoPrompt, knowledgeSource);

 // 异步模式：立即返回taskId，前端通过轮询 /api/jimeng/task/:taskId 获取状态
 res.json({
 success: true,
 taskId: videoResult.taskId,
 status: 'pending',
 message: '视频生成任务已提交',
 knowledgeSource,
 recordId: record?._id,
 });
    } catch (error) {
        console.error('知识视频生成错误:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || '知识视频生成失败',
        });
    }
};

/**
 * 获取知识视频历史记录
 * GET /api/knowledge/video-history/:userId
 */
const getKnowledgeVideoHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '缺少用户ID',
            });
        }

        console.log('[DEBUG] 获取知识视频历史, userId:', userId);

        const history = await JimengGeneration.find({
            userId: userId,
            type: 'video',
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        // 处理每条记录，确保返回完整的数据用于播放
        const processedHistory = history.map(record => {
            // 如果 videoUrls 为空但 resultUrl 存在，补充 videoUrls
            const videoUrls = record.videoUrls && record.videoUrls.length > 0
                ? record.videoUrls
                : (record.resultUrl ? [record.resultUrl] : []);

            // 构建可播放的视频 URL
            let playableUrl = null;
            if (record.localFilePath) {
                // 本地文件优先
                playableUrl = `/api/knowledge/video/${record._id}`;
            } else if (record.resultUrl && record.resultUrl.startsWith('http')) {
                // CDN URL
                playableUrl = record.resultUrl;
            }

            return {
                ...record,
                videoUrls,
                playableUrl,
            };
        });

        console.log('[DEBUG] 找到历史记录:', history.length);

        res.json({
            success: true,
            history: processedHistory,
            total: history.length,
        });
    } catch (error) {
        console.error('获取知识视频历史错误:', error);
        res.status(500).json({
            success: false,
            message: '获取历史记录失败',
        });
    }
};

/**
 * 代理播放本地视频
 * GET /api/knowledge/video/:recordId
 */
const serveLocalVideo = async (req, res) => {
    try {
        const { recordId } = req.params;

        console.log('[DEBUG] 请求本地视频, recordId:', recordId);

        const record = await JimengGeneration.findById(recordId);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: '视频记录不存在',
            });
        }

        if (!record.localFilePath) {
            return res.status(404).json({
                success: false,
                message: '本地视频文件不存在',
            });
        }

        // 检查文件是否存在
        if (!fs.existsSync(record.localFilePath)) {
            return res.status(404).json({
                success: false,
                message: '视频文件已被删除',
            });
        }

        // 获取文件信息
        const stat = fs.statSync(record.localFilePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        // 设置响应头
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(record.localFilePath)}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (range) {
            // 支持范围请求（拖动进度条）
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.status(206);

            const stream = fs.createReadStream(record.localFilePath, { start, end });
            stream.pipe(res);
        } else {
            res.status(200);
            const stream = fs.createReadStream(record.localFilePath);
            stream.pipe(res);
        }

    } catch (error) {
        console.error('播放本地视频失败:', error);
        res.status(500).json({
            success: false,
            message: '播放视频失败',
        });
    }
};

/**
 * 流式代理播放CDN视频
 * 解决CDN防盗链403问题 - 服务器作为代理转发视频流
 * GET /api/knowledge/proxy-video
 */
const proxyVideoStream = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: '缺少视频URL参数',
            });
        }

        console.log('[代理] 收到视频代理请求');
        console.log('[代理] 原始URL:', url);

        // 解码URL
        const videoUrl = decodeURIComponent(url);

        // 检查URL是否来自允许的CDN域名
        const allowedDomains = ['v26-aiop.aigc-cloud.com', 'v26.aigc-cloud.com'];
        let isAllowed = false;
        try {
            const urlObj = new URL(videoUrl);
            isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
        } catch (e) {
            console.error('[代理] URL解析失败:', e.message);
        }

        if (!isAllowed) {
            console.log('[代理] 域名不在允许列表中');
            return res.status(403).json({
                success: false,
                message: '不支持该视频源',
            });
        }

        // 设置代理请求头 - 模拟浏览器行为
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://jimeng.jianying.com/',
            'Origin': 'https://jimeng.jianying.com',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        };

        // 使用 https 模块进行代理请求
        const https = require('https');
        const http = require('http');
        const urlObj = new URL(videoUrl);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        console.log('[代理] 开始转发请求...');

        const proxyReq = protocol.request({
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: headers,
            timeout: 60000,
        }, (proxyRes) => {
            console.log('[代理] CDN响应状态:', proxyRes.statusCode);
            console.log('[代理] Content-Type:', proxyRes.headers['content-type']);

            // 如果CDN返回403，直接返回错误
            if (proxyRes.statusCode === 403) {
                console.error('[代理] CDN返回403禁止访问');
                proxyRes.resume();
                return res.status(403).json({
                    success: false,
                    message: '视频访问被拒绝(403)，可能已过期',
                });
            }

            // 如果是重定向，跟随重定向
            if (proxyRes.statusCode === 302 || proxyRes.statusCode === 301) {
                const location = proxyRes.headers.location;
                console.log('[代理] CDN重定向到:', location);
                if (location) {
                    // 递归处理重定向
                    proxyReq.destroy();
                    // 重定向到新的URL
                    return res.redirect(proxyRes.statusCode, location);
                }
            }

            // 设置响应头
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'video/mp4');
            res.setHeader('Content-Length', proxyRes.headers['content-length'] || '');
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache');

            // 支持范围请求（拖动进度条）
            if (proxyRes.headers['content-range']) {
                res.setHeader('Content-Range', proxyRes.headers['content-range']);
            }

            // 流式转发视频数据
            proxyRes.on('data', (chunk) => {
                res.write(chunk);
            });

            proxyRes.on('end', () => {
                console.log('[代理] 视频流传输完成');
                res.end();
            });

            proxyRes.on('error', (err) => {
                console.error('[代理] 视频流接收错误:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: '视频流传输失败',
                    });
                } else {
                    res.end();
                }
            });
        });

        proxyReq.on('error', (err) => {
            console.error('[代理] 请求错误:', err.message);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: '代理请求失败',
                });
            }
        });

        proxyReq.on('timeout', () => {
            console.error('[代理] 请求超时');
            proxyReq.destroy();
            if (!res.headersSent) {
                res.status(504).json({
                    success: false,
                    message: '代理请求超时',
                });
            }
        });

        proxyReq.end();

        // 处理客户端断开连接
        req.on('aborted', () => {
            console.log('[代理] 客户端断开连接');
            proxyReq.destroy();
        });

    } catch (error) {
        console.error('[代理] 代理错误:', error.message);
        res.status(500).json({
            success: false,
            message: '视频代理失败: ' + error.message,
        });
    }
};

module.exports = {
    generateKnowledgeVideo,
    getKnowledgeVideoHistory,
    serveLocalVideo,
    proxyVideoStream,
};