const OpenAI = require('openai');
const aiConfig = require('./aiConfig');

class GeminiService {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        const { apiUrl, apiKey, defaultModel } = aiConfig.gemini;

        if (!apiKey) {
            console.warn('⚠️ Gemini API key not configured. Set GEMINI_API_KEY in .env');
        }

        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: apiUrl,
            timeout: aiConfig.gemini.timeout,
            maxRetries: 3
        });

        this.defaultModel = defaultModel;
        this.initialized = true;
        console.log(`✅ GeminiService initialized with model: ${defaultModel}`);
    }

    async chat(messages, options = {}) {
        this.initialize();

        const model = options.model || this.defaultModel;
        const { temperature = 0.7, max_tokens, stream = false } = options;

        try {
            const response = await this.client.chat.completions.create({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: max_tokens,
                stream: stream
            });

            if (stream) {
                return response;
            }

            return {
                content: response.choices[0]?.message?.content || '',
                model: response.model,
                usage: response.usage,
                finish_reason: response.choices[0]?.finish_reason
            };
        } catch (error) {
            console.error('❌ Gemini API Error:', error.message);
            throw error;
        }
    }

    async generateText(prompt, options = {}) {
        return this.chat([
            { role: 'user', content: prompt }
        ], options);
    }

    async streamChat(messages, options = {}) {
        return this.chat(messages, { ...options, stream: true });
    }

    async generateFibonacci(n) {
        const prompt = `实现斐波那契数列计算。请实现一个高效的算法来计算第 ${n} 个斐波那契数。

要求：
1. 使用迭代而非递归（避免栈溢出）
2. 返回第 ${n} 个斐波那契数的值
3. 代码简洁高效

请只返回代码，不要解释。`;

        const result = await this.generateText(prompt, {
            temperature: 0.3,
            max_tokens: 500
        });

        return result.content;
    }
}

module.exports = new GeminiService();
