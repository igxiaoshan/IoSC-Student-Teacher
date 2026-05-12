const axios = require('axios');

// Dify API配置
const DIFY_API_BASE = process.env.DIFY_API_URL || 'http://localhost:3001/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'your_dify_api_key_here';

/**
 * 流式AI对话 - 学习助手
 */
const streamStudyAssistant = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { question, subject, context } = req.body;

        console.log(`[Streaming AI] 学习助手流式请求 - 学生${studentId}:`, {
            question: question?.substring(0, 50) + '...',
            subject,
            timestamp: new Date().toISOString()
        });

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // 构建Dify API请求
        const difyRequest = {
            inputs: {},
            query: `[角色: 学习助手]
[学科: ${subject || '通用'}]
[上下文: ${JSON.stringify(context || {})}]

${question}`,
            response_mode: 'streaming',
            conversation_id: context?.conversationId || '',
            user: studentId
        };

        console.log('[Dify Request]:', {
            url: `${DIFY_API_BASE}/chat-messages`,
            headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` },
            data: difyRequest
        });

        // 调用Dify流式API
        const difyResponse = await axios.post(
            `${DIFY_API_BASE}/chat-messages`,
            difyRequest,
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        let fullResponse = '';
        let conversationId = '';
        let buffer = ''; // 添加缓冲区处理跨chunk的数据

        // 处理流式响应
        difyResponse.data.on('data', (chunk) => {
            try {
                // 将新数据添加到缓冲区
                buffer += chunk.toString();

                // 按行分割数据
                const lines = buffer.split('\n');

                // 保留最后一行（可能不完整）
                buffer = lines.pop() || '';

                // 处理完整的行
                for (const line of lines) {
                    if (line.trim() && line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6).trim();

                            // 跳过空数据行
                            if (!jsonStr || jsonStr === '[DONE]') {
                                continue;
                            }

                            const data = JSON.parse(jsonStr);

                            console.log('[Dify Stream Data]:', data);

                            if (data.event === 'message') {
                                // 发送消息内容
                                const content = data.answer || '';
                                fullResponse += content;

                                // 发送到前端
                                res.write(`data: ${JSON.stringify({
                                    type: 'content',
                                    content: content,
                                    fullContent: fullResponse
                                })}\n\n`);
                            } else if (data.event === 'message_end') {
                                // 消息结束
                                conversationId = data.conversation_id || '';

                                res.write(`data: ${JSON.stringify({
                                    type: 'end',
                                    fullContent: fullResponse,
                                    conversationId: conversationId,
                                    metadata: data.metadata || {}
                                })}\n\n`);
                            } else if (data.event === 'error') {
                                // 错误处理
                                res.write(`data: ${JSON.stringify({
                                    type: 'error',
                                    error: data.message || '处理出错'
                                })}\n\n`);
                            } else if (data.event === 'message_file') {
                                // 文件消息处理
                                console.log('[File Message]:', data);
                            } else if (data.event === 'agent_thought') {
                                // Agent思考过程
                                console.log('[Agent Thought]:', data);
                            }
                        } catch (parseError) {
                            console.error('[Parse Error]:', parseError.message, 'Line:', line);
                            // 不中断流程，继续处理其他行
                        }
                    }
                }
            } catch (chunkError) {
                console.error('[Chunk Processing Error]:', chunkError.message);
            }
        });

        difyResponse.data.on('end', () => {
            console.log('[Streaming Complete]:', {
                studentId,
                responseLength: fullResponse.length,
                conversationId
            });
            res.end();
        });

        difyResponse.data.on('error', (error) => {
            console.error('[Streaming Error]:', error);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: '流式响应出错'
            })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('[Stream Study Assistant Error]:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message || '服务器错误'
        })}\n\n`);
        res.end();
    }
};

/**
 * 流式AI对话 - 学习伙伴
 */
const streamLearningCompanion = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { message } = req.body;

        console.log(`[Streaming AI] 学习伙伴流式请求 - 学生${studentId}:`, {
            message: message?.substring(0, 50) + '...',
            timestamp: new Date().toISOString()
        });

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // 构建Dify API请求 (学习伙伴应用)
        const difyRequest = {
            inputs: {},
            query: `[角色: 学习伙伴]
[学生ID: ${studentId}]

${message}`,
            response_mode: 'streaming',
            user: studentId
        };

        // 调用Dify流式API
        const difyResponse = await axios.post(
            `${DIFY_API_BASE}/chat-messages`,
            difyRequest,
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        let fullResponse = '';
        let conversationId = '';
        let buffer = ''; // 添加缓冲区处理跨chunk的数据

        // 处理流式响应
        difyResponse.data.on('data', (chunk) => {
            try {
                // 将新数据添加到缓冲区
                buffer += chunk.toString();

                // 按行分割数据
                const lines = buffer.split('\n');

                // 保留最后一行（可能不完整）
                buffer = lines.pop() || '';

                // 处理完整的行
                for (const line of lines) {
                    if (line.trim() && line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6).trim();

                            // 跳过空数据行
                            if (!jsonStr || jsonStr === '[DONE]') {
                                continue;
                            }

                            const data = JSON.parse(jsonStr);

                            console.log('[Dify Companion Stream Data]:', data);

                            if (data.event === 'message') {
                                const content = data.answer || '';
                                fullResponse += content;

                                res.write(`data: ${JSON.stringify({
                                    type: 'content',
                                    content: content,
                                    fullContent: fullResponse
                                })}\n\n`);
                            } else if (data.event === 'message_end') {
                                conversationId = data.conversation_id || '';

                                res.write(`data: ${JSON.stringify({
                                    type: 'end',
                                    fullContent: fullResponse,
                                    conversationId: conversationId,
                                    companionMood: 'friendly',
                                    metadata: data.metadata || {}
                                })}\n\n`);
                            } else if (data.event === 'error') {
                                res.write(`data: ${JSON.stringify({
                                    type: 'error',
                                    error: data.message || '处理出错'
                                })}\n\n`);
                            }
                        } catch (parseError) {
                            console.error('[Companion Parse Error]:', parseError.message, 'Line:', line);
                            // 不中断流程，继续处理其他行
                        }
                    }
                }
            } catch (chunkError) {
                console.error('[Companion Chunk Processing Error]:', chunkError.message);
            }
        });

        difyResponse.data.on('end', () => {
            console.log('[Streaming Complete]:', {
                studentId,
                responseLength: fullResponse.length,
                conversationId
            });
            res.end();
        });

        difyResponse.data.on('error', (error) => {
            console.error('[Streaming Error]:', error);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: '流式响应出错'
            })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('[Stream Learning Companion Error]:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message || '服务器错误'
        })}\n\n`);
        res.end();
    }
};

module.exports = {
    streamStudyAssistant,
    streamLearningCompanion
};
