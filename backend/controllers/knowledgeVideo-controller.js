/**
 * 知识视频生成控制器
 * 先查询Dify知识库，根据结果决定视频生成内容
 */

const axios = require('axios');
const jimengService = require('../services/jimengService');
const difyConfig = require('../config/difyConfig');
const JimengGeneration = require('../models/JimengGeneration');

/**
 * 保存知识视频生成记录
 */
const saveKnowledgeVideoRecord = async (userId, userType, taskId, keyword, prompt, knowledgeSource) => {
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
 * 4. 调用即梦API生成视频（当前使用模拟模式）
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

        // Step 2: 生成视频prompt
        let videoPrompt;
        if (knowledgeContent && knowledgeContent.length > 0) {
            // 有知识库内容，用前500字符作为prompt
            videoPrompt = knowledgeContent.substring(0, 500);
            console.log('[视频生成] 使用Dify知识库内容生成视频');
        } else {
            // 无知识库内容，用原生词条
            videoPrompt = `教学视频：${keyword}，生动形象地讲解这个知识点的概念、原理和应用示例`;
            console.log('[视频生成] 使用原生词条生成视频');
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

        // Step 4: 直接使用模拟模式（API额度到期）
        // TODO: API额度恢复后，改为调用真实API
        const mockResponse = jimengService.getMockResponse('video');
        const taskId = mockResponse.data.task_id;

        console.log('[视频生成] 使用模拟模式, taskId:', taskId);

        // 保存记录
        await saveKnowledgeVideoRecord(userId, userType, taskId, keyword, videoPrompt, knowledgeSource);

        res.json({
            success: true,
            taskId: taskId,
            status: 'pending',
            message: '知识视频任务已提交(模拟模式)',
            mock: true,
            knowledgeSource,
            videoPrompt: knowledgeSource === 'dify' ? '[Dify知识库内容]' : '[原生词条]',
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

module.exports = {
    generateKnowledgeVideo,
    getKnowledgeVideoHistory,
};