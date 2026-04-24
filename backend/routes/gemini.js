const router = require('express').Router();
const geminiService = require('../services/geminiService');

/**
 * Gemini API 测试路由
 */

// 获取服务状态
router.get('/status', (req, res) => {
    res.json({
        success: true,
        service: 'gemini',
        status: 'ready',
        model: geminiService.defaultModel
    });
});

// 测试聊天
router.post('/chat', async (req, res) => {
    try {
        const { messages, model, temperature, max_tokens } = req.body;

        if (!messages) {
            return res.status(400).json({
                success: false,
                error: 'messages is required'
            });
        }

        const result = await geminiService.chat(messages, {
            model,
            temperature,
            max_tokens
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 生成文本
router.post('/generate', async (req, res) => {
    try {
        const { prompt, model, temperature, max_tokens } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'prompt is required'
            });
        }

        const result = await geminiService.generateText(prompt, {
            model,
            temperature,
            max_tokens
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 流式聊天
router.post('/stream', async (req, res) => {
    try {
        const { messages, model, temperature } = req.body;

        if (!messages) {
            return res.status(400).json({
                success: false,
                error: 'messages is required'
            });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await geminiService.streamChat(messages, {
            model,
            temperature
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 测试用例：斐波那契
router.post('/test/fibonacci', async (req, res) => {
    try {
        const { n = 10 } = req.body;
        const result = await geminiService.generateFibonacci(n);

        res.json({
            success: true,
            prompt: `Calculate Fibonacci(${n})`,
            response: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
