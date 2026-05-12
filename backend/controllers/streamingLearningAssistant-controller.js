const difyService = require('../services/difyService');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');

/**
 * 流式学习助手对话
 */
const streamLearningAssistant = async (req, res) => {
    try {
        const { studentId, subjectId, question, conversationId, userType } = req.body;

  const difyUserType = userType === 'teacher' ? '老师' : '学生';

        console.log(`[流式学习助手] 学生${studentId}提问:`, {
            question: question?.substring(0, 50) + '...',
            subjectId,
            conversationId,
            timestamp: new Date().toISOString()
        });

        // 验证必要参数
        if (!studentId || !question) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：studentId 和 question'
            });
        }

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no' // 禁用nginx缓冲
        });

        // 发送连接确认
        res.write(`data: ${JSON.stringify({ type: 'connected', message: '连接成功' })}\n\n`);

        try {
            // 获取学生信息
            const student = await Student.findById(studentId)
                .populate('sclassName', 'sclassName')
                .populate('selectedSubjects.subject', 'subName subCode');

            if (!student) {
                res.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    message: '学生不存在' 
                })}\n\n`);
                res.end();
                return;
            }

            // 获取科目信息
            let subjectInfo = null;
            if (subjectId) {
                subjectInfo = await Subject.findById(subjectId);
            }

            // 构建上下文
            const context = {
                studentId,
                subjectId,
                subjectName: subjectInfo?.subName || '通用',
                conversationId,
                courseContent: subjectInfo?.description || '',
                studentHistory: '暂无历史记录'
            };

            // 流式回调函数
            const onChunk = (chunk) => {
                if (chunk && chunk.trim()) {
                    res.write(`data: ${JSON.stringify({ 
                        type: 'chunk', 
                        content: chunk 
                    })}\n\n`);
                }
            };

            const onComplete = (result) => {
                res.write(`data: ${JSON.stringify({ 
                    type: 'complete',
                    conversationId: result.conversationId,
                    messageId: result.messageId,
                    fullContent: result.fullContent
                })}\n\n`);
                res.end();
            };

            const onError = (error) => {
                console.error('流式对话错误:', error);
                res.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    message: error.message || '对话过程中发生错误' 
                })}\n\n`);
                res.end();
            };

            // 调用Dify流式API
            await difyService.chatWithLearningAssistantStream(
                question,
                context,
                onChunk,
                onComplete,
                onError
            );

        } catch (error) {
            console.error('处理流式请求错误:', error);
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                message: '处理请求时发生错误：' + error.message 
            })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error('流式学习助手错误:', error);
        
        // 如果响应头还没发送，发送错误响应
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: '流式对话初始化失败',
                error: error.message
            });
        } else {
            // 如果已经开始流式响应，发送错误事件
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                message: '服务器错误：' + error.message 
            })}\n\n`);
            res.end();
        }
    }
};

/**
 * 普通学习助手对话（非流式，作为备用）
 */
const chatLearningAssistant = async (req, res) => {
    try {
        const { studentId, subjectId, question, conversationId, userType } = req.body;

  const difyUserType = userType === 'teacher' ? '老师' : '学生';

        console.log(`[学习助手] 学生${studentId}提问:`, {
            question: question?.substring(0, 50) + '...',
            subjectId,
            conversationId
        });

        // 验证必要参数
        if (!studentId || !question) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：studentId 和 question'
            });
        }

        // 获取学生信息
        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('selectedSubjects.subject', 'subName subCode');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 获取科目信息
        let subjectInfo = null;
        if (subjectId) {
            subjectInfo = await Subject.findById(subjectId);
        }

        // 构建上下文
        const context = {
            studentId,
            subjectId,
            subjectName: subjectInfo?.subName || '通用',
            conversationId,
            courseContent: subjectInfo?.description || '',
            studentHistory: '暂无历史记录'
        };

        // 调用Dify API
        const result = await difyService.chatWithLearningAssistant(question, context);

        if (result.success) {
            res.json({
                success: true,
                answer: result.answer,
                conversationId: result.conversationId,
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || '对话失败',
                answer: result.answer
            });
        }

    } catch (error) {
        console.error('学习助手对话错误:', error);
        res.status(500).json({
            success: false,
            message: '对话过程中发生错误',
            error: error.message
        });
    }
};

/**
 * 获取对话历史
 */
const getChatHistory = async (req, res) => {
    try {
        const { studentId, conversationId } = req.params;

        // 这里可以实现对话历史的获取逻辑
        // 目前返回空数组，后续可以集成数据库存储
        
        res.json({
            success: true,
            data: {
                conversationId,
                messages: [],
                totalCount: 0
            }
        });

    } catch (error) {
        console.error('获取对话历史错误:', error);
        res.status(500).json({
            success: false,
            message: '获取对话历史失败',
            error: error.message
        });
    }
};

/**
 * 清除对话历史
 */
const clearChatHistory = async (req, res) => {
    try {
        const { studentId, conversationId } = req.params;

        // 这里可以实现清除对话历史的逻辑
        
        res.json({
            success: true,
            message: '对话历史已清除'
        });

    } catch (error) {
        console.error('清除对话历史错误:', error);
        res.status(500).json({
            success: false,
            message: '清除对话历史失败',
            error: error.message
        });
    }
};

module.exports = {
    streamLearningAssistant,
    chatLearningAssistant,
    getChatHistory,
    clearChatHistory
};
