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
 * @returns {Promise<string>} 本地文件路径
 */
const downloadVideoToLocal = async (videoUrl, taskId) => {
    try {
        console.log('[下载] 开始下载视频:', videoUrl);

        // 生成文件名
        const fileName = `${taskId}_${Date.now()}.mp4`;
        const filePath = path.join(VIDEO_STORAGE_DIR, fileName);

        // 下载视频 - 模拟浏览器请求头
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity;q=1, *;q=0',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://jimeng.jianying.com/',
            'Origin': 'https://jimeng.jianying.com',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Range': 'bytes=0-'
        };

        const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            headers,
            timeout: 120000, // 视频下载较慢，设置2分钟超时
        });

        // 保存文件
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('[下载] 视频下载完成:', filePath);
                resolve(filePath);
            });
            writer.on('error', (err) => {
                console.error('[下载] 写入文件失败:', err);
                reject(err);
            });
        });

    } catch (error) {
        console.error('[下载] 视频下载失败:', error.message);
        throw error;
    }
};

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
            inputs: {
                question: keyword,
                subject: subject || '通用',
            },
            query: `请详细介绍"${keyword}"这个知识点，包括概念、原理和应用示例`,
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
                timeout: 30000,
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

        // Step 5: 轮询获取视频URL
        console.log('[视频生成] 开始轮询获取视频URL...');
        let videoUrl = null;
        let pollCount = 0;
        const maxPolls = 60; // 最多轮询60次（5分钟）

        while (pollCount < maxPolls) {
            try {
                const taskResult = await jimengService.getVideoTaskResult(videoResult.taskId);
                console.log(`[视频生成] 轮询${pollCount + 1}: status=${taskResult.status}`);

                if (taskResult.status === 'done' && taskResult.videoUrls && taskResult.videoUrls.length > 0) {
                    videoUrl = taskResult.videoUrls[0];
                    console.log('[视频生成] 获取到视频URL:', videoUrl);
                    break;
                }

                if (taskResult.status === 'failed') {
                    console.log('[视频生成] 视频生成失败');
                    await updateKnowledgeVideoRecord(videoResult.taskId, 'failed');
                    return res.status(500).json({
                        success: false,
                        message: '视频生成失败',
                    });
                }

                // 等待5秒后继续轮询
                await new Promise(resolve => setTimeout(resolve, 5000));
                pollCount++;
            } catch (pollError) {
                console.error('[视频生成] 轮询出错:', pollError.message);
                pollCount++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (!videoUrl) {
            console.log('[视频生成] 轮询超时，未获取到视频URL');
            return res.status(500).json({
                success: false,
                message: '获取视频超时',
            });
        }

        // Step 6: 下载视频到本地
        console.log('[视频生成] 开始下载视频到本地...');
        let localFilePath = null;
        try {
            localFilePath = await downloadVideoToLocal(videoUrl, videoResult.taskId);
            console.log('[视频生成] 视频下载完成:', localFilePath);
        } catch (downloadError) {
            console.error('[视频生成] 视频下载失败:', downloadError.message);
            // 下载失败但视频URL已获取，记录错误但不中断流程
        }

        // Step 7: 更新记录状态
        // 优先使用本地路径存储 resultUrl，这样前端查询时可以直接使用
        const finalResultUrl = localFilePath ? `/api/knowledge/video/${record?._id}` : videoUrl;
        await updateKnowledgeVideoRecord(videoResult.taskId, 'completed', localFilePath, finalResultUrl);

        res.json({
            success: true,
            taskId: videoResult.taskId,
            status: 'completed',
            message: '视频生成成功',
            knowledgeSource,
            recordId: record?._id,
            videoUrl: localFilePath ? `/api/knowledge/video/${record?._id}` : videoUrl, // 本地视频返回代理URL
            originalUrl: videoUrl, // 原始CDN URL
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
            'params.knowledgeSource': { $exists: true }
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        console.log('[DEBUG] 找到历史记录:', history.length);

        res.json({
            success: true,
            history,
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

module.exports = {
    generateKnowledgeVideo,
    getKnowledgeVideoHistory,
    serveLocalVideo,
};