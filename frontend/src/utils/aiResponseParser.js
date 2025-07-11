/**
 * AI回复内容解析工具
 * 处理包含<think>标签的AI回复
 */

/**
 * 解析AI回复内容，分离思考过程和最终回答
 * @param {string} content - AI返回的原始内容
 * @returns {object} 解析后的内容对象
 */
export const parseAIResponse = (content) => {
    if (!content || typeof content !== 'string') {
        return {
            hasThinking: false,
            thinking: '',
            answer: content || '',
            originalContent: content || ''
        };
    }

    // 匹配<think>标签内容
    const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
    const match = content.match(thinkRegex);

    if (match) {
        const thinking = match[1].trim();
        const answer = content.replace(thinkRegex, '').trim();
        
        return {
            hasThinking: true,
            thinking: thinking,
            answer: answer,
            originalContent: content
        };
    }

    return {
        hasThinking: false,
        thinking: '',
        answer: content.trim(),
        originalContent: content
    };
};

/**
 * 格式化思考过程文本
 * @param {string} thinking - 思考过程文本
 * @returns {string} 格式化后的文本
 */
export const formatThinkingText = (thinking) => {
    if (!thinking) return '';
    
    // 移除多余的换行和空格
    return thinking
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');
};

/**
 * 检查内容是否包含思考过程
 * @param {string} content - 内容
 * @returns {boolean} 是否包含思考过程
 */
export const hasThinkingProcess = (content) => {
    if (!content || typeof content !== 'string') return false;
    return /<think>[\s\S]*?<\/think>/i.test(content);
};

/**
 * 移除思考过程，只返回最终答案
 * @param {string} content - 原始内容
 * @returns {string} 最终答案
 */
export const extractAnswer = (content) => {
    const parsed = parseAIResponse(content);
    return parsed.answer;
};

/**
 * 只提取思考过程
 * @param {string} content - 原始内容
 * @returns {string} 思考过程
 */
export const extractThinking = (content) => {
    const parsed = parseAIResponse(content);
    return parsed.thinking;
};
